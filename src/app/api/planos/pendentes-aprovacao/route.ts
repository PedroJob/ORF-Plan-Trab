import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canApproveBasedOnRole } from "@/lib/permissions";
import { getApprovalChain, getCurrentApprovalLevel } from "@/lib/approval-chain";
import { StatusPlano } from "@prisma/client";

/**
 * GET /api/planos/pendentes-aprovacao
 *
 * Retorna planos aguardando aprovação do usuário logado.
 * Para S4: planos onde o nível atual de aprovação corresponde à sua OM ou OMs subordinadas.
 * Para SUPER_ADMIN: todos os planos em análise.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

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

    // Verificar se o usuário pode aprovar (S4 ou SUPER_ADMIN)
    if (!canApproveBasedOnRole(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para aprovar planos" },
        { status: 403 }
      );
    }

    // Buscar todos os planos em análise
    const planosEmAnalise = await prisma.planoTrabalho.findMany({
      where: {
        status: StatusPlano.EM_ANALISE,
        nivelAprovacaoAtual: { not: null },
      },
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        operacao: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
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
        responsavel: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeGuerra: true,
            postoGraduacao: true,
          },
        },
        _count: {
          select: {
            despesas: true,
          },
        },
      },
      orderBy: [{ dataEnvioAnalise: "asc" }, { createdAt: "asc" }],
    });

    // Filtrar planos que o usuário pode aprovar
    const planosPendentes = [];

    for (const plano of planosEmAnalise) {
      // Obter cadeia de aprovação do plano
      const approvalChain = await getApprovalChain(plano.omId);
      const currentLevel = getCurrentApprovalLevel(
        plano.nivelAprovacaoAtual!,
        approvalChain
      );

      if (!currentLevel) continue;

      // SUPER_ADMIN vê todos os planos pendentes
      // S4 vê apenas planos onde o nível atual corresponde à sua OM
      const canApprove =
        user.role === "SUPER_ADMIN" || user.omId === currentLevel.omId;

      if (canApprove) {
        planosPendentes.push({
          ...plano,
          cadeiaAprovacao: approvalChain.map((n) => ({
            nivel: n.nivel,
            omSigla: n.omSigla,
            omNome: n.omNome,
            status:
              n.nivel < plano.nivelAprovacaoAtual!
                ? "aprovado"
                : n.nivel === plano.nivelAprovacaoAtual
                  ? "atual"
                  : "pendente",
          })),
          nivelAtual: {
            nivel: currentLevel.nivel,
            omId: currentLevel.omId,
            omSigla: currentLevel.omSigla,
            omNome: currentLevel.omNome,
          },
        });
      }
    }

    return NextResponse.json({
      planos: planosPendentes,
      total: planosPendentes.length,
    });
  } catch (error) {
    console.error("Get planos pendentes error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
