import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calcularDespesa } from "@/lib/calculos-despesas";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const rateioOMSchema = z.object({
  omId: z.string().cuid("ID de OM inválido"),
  percentual: z.number().min(0.01).max(100),
});

const rateioNaturezaSchema = z.object({
  naturezaId: z.string().cuid("ID de natureza inválido"),
  percentual: z.number().min(0.01).max(100),
});

const createDespesaSchema = z.object({
  classeId: z.string().cuid("ID de classe inválido"),
  tipoId: z.string().cuid("ID de tipo inválido").nullable().optional(),
  valorTotal: z.number().min(0),
  valorCombustivel: z.number().optional(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  naturezas: z
    .array(rateioNaturezaSchema)
    .min(1, "Selecione ao menos uma natureza"),
  parametros: z.any(), // JSON com parâmetros específicos da classe
  oms: z.array(rateioOMSchema).min(1, "Selecione ao menos uma OM"),
});

/**
 * GET /api/planos/[id]/despesas
 * Lista todas as despesas de um plano LOGISTICO
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se plano existe e é LOGISTICO
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      select: { tipo: true },
    });

    if (!plano) {
      return NextResponse.json(
        { error: "Plano de trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (plano.tipo !== "LOGISTICO") {
      return NextResponse.json(
        { error: "Despesas só estão disponíveis para planos LOGISTICO" },
        { status: 400 }
      );
    }

    // Buscar despesas
    const despesas = await prisma.despesa.findMany({
      where: { planoTrabalhoId: id },
      include: {
        classe: {
          select: {
            nome: true,
            descricao: true,
          },
        },
        tipo: {
          select: {
            nome: true,
            isCombustivel: true,
          },
        },
        oms: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                codUG: true,
              },
            },
          },
        },
        despesasNaturezas: {
          include: {
            natureza: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error("Get despesas error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/planos/[id]/despesas
 * Cria uma nova despesa (apenas para planos LOGISTICO)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se plano existe e é LOGISTICO
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: { operacao: true },
    });

    if (!plano) {
      return NextResponse.json(
        { error: "Plano de trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (plano.tipo !== "LOGISTICO") {
      return NextResponse.json(
        { error: "Despesas só podem ser criadas em planos LOGISTICO" },
        { status: 400 }
      );
    }

    // Verificar bloqueio (plano em análise)
    if (plano.status === "EM_ANALISE") {
      return NextResponse.json(
        { error: "Plano em análise não pode ter despesas adicionadas. Aguardando aprovação." },
        { status: 403 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (
      !user ||
      (plano.responsavelId !== user.id &&
        !["CMT_OM", "CMT_BRIGADA", "CMT_CMA", "SUPER_ADMIN"].includes(
          user.role
        ))
    ) {
      return NextResponse.json(
        { error: "Sem permissão para adicionar despesas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createDespesaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      classeId,
      tipoId,
      descricao,
      naturezas,
      parametros,
      oms,
      valorTotal,
      valorCombustivel,
    } = validation.data;

    // Validar classe e tipo
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe não encontrada" },
        { status: 404 }
      );
    }

    // Validar tipo apenas se foi fornecido
    let tipo = null;
    if (tipoId) {
      tipo = await prisma.tipo.findFirst({
        where: { id: tipoId, classeId: classeId },
      });

      if (!tipo) {
        return NextResponse.json(
          { error: "Tipo não encontrado ou não pertence a esta classe" },
          { status: 404 }
        );
      }
    }

    // Validar rateio de naturezas (soma deve ser 100%)
    const somaPercentuaisNaturezas = naturezas.reduce(
      (sum, nat) => sum + nat.percentual,
      0
    );
    if (Math.abs(somaPercentuaisNaturezas - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `A soma dos percentuais de naturezas deve ser 100%. Soma atual: ${somaPercentuaisNaturezas}%`,
        },
        { status: 400 }
      );
    }

    // Validar que todas as naturezas existem
    const naturezaIds = naturezas.map((nat) => nat.naturezaId);
    const naturezasExistentes = await prisma.naturezaDespesa.findMany({
      where: { id: { in: naturezaIds } },
    });

    if (naturezasExistentes.length !== naturezaIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais naturezas não foram encontradas" },
        { status: 404 }
      );
    }

    // Validar naturezas (devem estar nas permitidas pela classe)
    const codigosNaturezas = naturezasExistentes.map((nat) => nat.codigo);
    const naturezasInvalidas = codigosNaturezas.filter(
      (codigo) => !classe.naturezasPermitidas.includes(codigo)
    );

    if (naturezasInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: `Naturezas não permitidas para esta classe: ${naturezasInvalidas.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validar rateio de OMs (soma deve ser 100%)
    const somaPercentuais = oms.reduce((sum, om) => sum + om.percentual, 0);
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      // Tolerância de 0.01
      return NextResponse.json(
        {
          error: `A soma dos percentuais deve ser 100%. Soma atual: ${somaPercentuais}%`,
        },
        { status: 400 }
      );
    }

    // Validar que todas as OMs existem
    const omIds = oms.map((om) => om.omId);
    const omsExistentes = await prisma.organizacaoMilitar.findMany({
      where: { id: { in: omIds } },
    });

    if (omsExistentes.length !== omIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais OMs não foram encontradas" },
        { status: 404 }
      );
    }
    // Criar despesa com rateio
    const despesa = await prisma.despesa.create({
      data: {
        descricao,
        planoTrabalhoId: id,
        classeId: classeId,
        tipoId: tipoId,
        parametros: parametros,
        valorCalculado: valorTotal,
        valorCombustivel,
        oms: {
          create: oms.map((om) => ({
            omId: om.omId,
            percentual: om.percentual,
          })),
        },
        despesasNaturezas: {
          create: naturezas.map((nat) => ({
            naturezaId: nat.naturezaId,
            percentual: nat.percentual,
          })),
        },
      },
      include: {
        classe: {
          select: {
            nome: true,
            descricao: true,
          },
        },
        tipo: {
          select: {
            nome: true,
            isCombustivel: true,
          },
        },
        oms: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                codUG: true,
              },
            },
          },
        },
        despesasNaturezas: {
          include: {
            natureza: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                descricao: true,
              },
            },
          },
        },
      },
    });

    // Recalculate total for the plano
    const despesasTotal = await prisma.despesa.aggregate({
      where: { planoTrabalhoId: id },
      _sum: { valorCalculado: true },
    });

    await prisma.planoTrabalho.update({
      where: { id },
      data: {
        valorTotalDespesas: despesasTotal._sum.valorCalculado || 0,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: "CRIACAO",
        descricao: `Despesa criada no plano "${plano.titulo}" - ${classe.nome}`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        metadados: {
          despesaId: despesa.id,
          classe: classe.nome,
          tipo: tipo?.nome || 'Sem tipo',
          valorTotal: valorTotal,
        },
      },
    });

    return NextResponse.json(despesa, { status: 201 });
  } catch (error) {
    console.error("Create despesa error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
