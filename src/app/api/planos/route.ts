import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  canCreatePlanoTrabalho,
  canFillPlanoTrabalho,
} from "@/lib/permissions";
import { getTodasOmsSubordinadas } from "@/lib/validators/om-participante";
import { z } from "zod";
import { StatusPlano, Prioridade, TipoEvento } from "@prisma/client";

const createPlanoSchema = z.object({
  operacaoId: z.string().cuid("ID de operação inválido"),
  titulo: z.string().min(1, "Título é obrigatório"),
  prioridade: z.nativeEnum(Prioridade).optional(),
  omId: z.string().cuid("ID de OM inválido").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const operacaoId = searchParams.get("operacaoId");

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { om: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const whereClause: any = {};

    if (operacaoId) {
      whereClause.operacaoId = operacaoId;
    }

    // Filtrar por OM se não for role que vê tudo
    if (!["SUPER_ADMIN"].includes(user.role)) {
      // Buscar OMs subordinadas ao usuário
      const subordinadas = await getTodasOmsSubordinadas(user.omId);
      const omsIds = [user.omId, ...subordinadas.map((s) => s.id)];

      // Usuário vê planos da sua OM ou de OMs subordinadas
      whereClause.omId = { in: omsIds };
    }

    const planos = await prisma.planoTrabalho.findMany({
      where: whereClause,
      include: {
        operacao: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                tipo: true,
              },
            },
            omsParticipantes: {
              include: {
                om: {
                  select: {
                    id: true,
                    nome: true,
                    sigla: true,
                  },
                },
              },
            },
          },
        },
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeGuerra: true,
            postoGraduacao: true,
          },
        },
        despesas: {
          select: {
            id: true,
            valorCalculado: true,
          },
        },
        _count: {
          select: {
            despesas: true,
            documentosReferencia: true,
            anotacoes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(planos);
  } catch (error) {
    console.error("Get planos error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user || !canCreatePlanoTrabalho(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar plano de trabalho" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createPlanoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se operação existe
    const operacao = await prisma.operacao.findUnique({
      where: { id: data.operacaoId },
      include: {
        omsParticipantes: true,
      },
    });

    if (!operacao) {
      return NextResponse.json(
        { error: "Operação não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o usuário pode preencher plano para esta operação
    // SUPER_ADMIN pode sempre criar
    if (user.role !== "SUPER_ADMIN") {
      const canFill = await canFillPlanoTrabalho(
        data.omId || user.omId,
        data.operacaoId
      );

      if (!canFill.allowed) {
        return NextResponse.json(
          {
            error:
              canFill.reason || "Você não pode criar plano para esta operação",
          },
          { status: 403 }
        );
      }
    }

    // Verificar se já existe plano para esta OM nesta operação
    const existingPlano = await prisma.planoTrabalho.findUnique({
      where: {
        operacaoId_omId: {
          operacaoId: data.operacaoId,
          omId: data.omId || user.omId,
        },
      },
    });

    if (existingPlano) {
      return NextResponse.json(
        {
          error: "Já existe um plano de trabalho da sua OM para esta operação",
        },
        { status: 400 }
      );
    }

    // Obter próxima versão (global para a operação, para histórico)
    const lastVersion = await prisma.planoTrabalho.findFirst({
      where: { operacaoId: data.operacaoId },
      orderBy: { versao: "desc" },
      select: { versao: true },
    });

    const nextVersion = lastVersion ? lastVersion.versao + 1 : 1;

    // Criar plano vinculado à OM do usuário
    const plano = await prisma.planoTrabalho.create({
      data: {
        titulo: data.titulo,
        versao: nextVersion,
        operacaoId: data.operacaoId,
        omId: data.omId || user.omId,
        responsavelId: user.id,
        prioridade: data.prioridade || Prioridade.MEDIA,
        status: StatusPlano.RASCUNHO,
      },
      include: {
        operacao: {
          include: {
            om: true,
            omsParticipantes: {
              include: {
                om: true,
              },
            },
          },
        },
        om: true,
        responsavel: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeGuerra: true,
            postoGraduacao: true,
          },
        },
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: TipoEvento.CRIACAO,
        descricao: `Plano de Trabalho "${plano.titulo}" criado (v${plano.versao})`,
        usuarioId: user.id,
        planoTrabalhoId: plano.id,
        operacaoId: plano.operacaoId,
        metadados: {
          plano: {
            titulo: plano.titulo,
            versao: plano.versao,
          },
        },
      },
    });

    return NextResponse.json(plano, { status: 201 });
  } catch (error) {
    console.error("Create plano error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
