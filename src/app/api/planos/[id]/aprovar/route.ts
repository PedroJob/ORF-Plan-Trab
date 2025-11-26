import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canApproveBasedOnRole, getApprovalLevelName } from "@/lib/permissions";
import {
  getApprovalChain,
  getCurrentApprovalLevel,
  getNextApprovalLevel,
  isFinalApprovalLevel,
} from "@/lib/approval-chain";
import { z } from "zod";
import { StatusPlano, AcaoAprovacao, TipoEvento } from "@prisma/client";

const approvalSchema = z.object({
  acao: z.nativeEnum(AcaoAprovacao),
  motivo: z.string().optional(),
});

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

    // Verificar permissão básica de aprovar (deve ser S4 ou SUPER_ADMIN)
    if (!canApproveBasedOnRole(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão para aprovar planos" },
        { status: 403 }
      );
    }

    // Buscar plano com OM
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        om: true,
        operacao: {
          include: { om: true },
        },
      },
    });

    if (!plano) {
      return NextResponse.json(
        { error: "Plano de trabalho não encontrado" },
        { status: 404 }
      );
    }

    if (plano.status !== StatusPlano.EM_ANALISE) {
      return NextResponse.json(
        { error: "Plano não está em análise" },
        { status: 400 }
      );
    }

    // Validar nível de aprovação atual
    if (!plano.nivelAprovacaoAtual) {
      return NextResponse.json(
        { error: "Nível de aprovação não definido no plano" },
        { status: 400 }
      );
    }

    // Obter cadeia de aprovação baseada na OM do plano
    const approvalChain = await getApprovalChain(plano.omId);
    const currentLevel = getCurrentApprovalLevel(
      plano.nivelAprovacaoAtual,
      approvalChain
    );

    if (!currentLevel) {
      return NextResponse.json(
        { error: "Nível de aprovação inválido" },
        { status: 400 }
      );
    }

    // Verificar se o usuário pode aprovar neste nível (sua OM deve corresponder)
    // SUPER_ADMIN pode aprovar em qualquer nível
    if (user.role !== "SUPER_ADMIN" && user.omId !== currentLevel.omId) {
      return NextResponse.json(
        {
          error: `Sem permissão para aprovar neste nível. Aguardando aprovação do S4 - ${currentLevel.omSigla}`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { acao, motivo } = validation.data;

    // Validar motivo obrigatório para reprovação
    if (acao === AcaoAprovacao.REPROVADO && !motivo) {
      return NextResponse.json(
        { error: "Motivo é obrigatório para reprovação" },
        { status: 400 }
      );
    }

    const nivelAtual = plano.nivelAprovacaoAtual;

    // Registrar aprovação/reprovação com nível hierárquico
    await prisma.aprovacaoHistorico.create({
      data: {
        acao,
        motivo,
        nivelHierarquico: nivelAtual,
        planoTrabalhoId: id,
        aprovadorId: user.id,
        omNivelId: currentLevel.omId, // OM do nível que está aprovando
      },
    });

    let newStatus: StatusPlano;
    let newNivel: number | null;
    let nextLevel = null;

    if (acao === AcaoAprovacao.APROVADO) {
      // Verificar se é aprovação final
      if (isFinalApprovalLevel(nivelAtual, approvalChain)) {
        newStatus = StatusPlano.APROVADO;
        newNivel = null; // Limpa o nível após aprovação final
      } else {
        // Continua em análise para próximo nível
        newStatus = StatusPlano.EM_ANALISE;
        nextLevel = getNextApprovalLevel(nivelAtual, approvalChain);
        newNivel = nextLevel?.nivel || nivelAtual + 1;
      }
    } else {
      // Reprovado - volta para RASCUNHO
      newStatus = StatusPlano.RASCUNHO;
      newNivel = null;
    }

    // Atualizar status do plano
    const updatedPlano = await prisma.planoTrabalho.update({
      where: { id },
      data: {
        status: newStatus,
        nivelAprovacaoAtual: newNivel,
        // Limpa dataBloqueio se for reprovado ou aprovado finalmente
        dataBloqueio:
          newStatus === StatusPlano.EM_ANALISE ? plano.dataBloqueio : null,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento:
          acao === AcaoAprovacao.APROVADO
            ? TipoEvento.APROVACAO
            : TipoEvento.REPROVACAO,
        descricao: `Plano "${plano.titulo}" ${acao === AcaoAprovacao.APROVADO ? "aprovado" : "reprovado"} por ${user.postoGraduacao} ${user.nomeCompleto} (${getApprovalLevelName(nivelAtual, currentLevel.omSigla)})`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        operacaoId: plano.operacaoId,
        metadados: {
          acao,
          motivo,
          nivelHierarquico: nivelAtual,
          nomeNivel: getApprovalLevelName(nivelAtual, currentLevel.omSigla),
          omNivel: currentLevel.omNome,
          omNivelSigla: currentLevel.omSigla,
          statusAnterior: plano.status,
          statusNovo: newStatus,
          proximoNivel: newNivel,
          proximoNivelOm: nextLevel?.omSigla,
        },
      },
    });

    // Construir mensagem de resposta
    let message: string;
    if (acao === AcaoAprovacao.APROVADO) {
      if (isFinalApprovalLevel(nivelAtual, approvalChain)) {
        message =
          "Plano aprovado com sucesso! Todas as aprovações foram concluídas.";
      } else {
        message = `Plano aprovado pelo S4 - ${currentLevel.omSigla}. Aguardando aprovação do S4 - ${nextLevel?.omSigla}`;
      }
    } else {
      message =
        "Plano reprovado. O responsável poderá fazer correções e reenviar.";
    }

    return NextResponse.json({
      success: true,
      plano: updatedPlano,
      message,
      proximoNivel: nextLevel
        ? {
            nivel: nextLevel.nivel,
            descricao: `S4 - ${nextLevel.omSigla}`,
            omId: nextLevel.omId,
            omSigla: nextLevel.omSigla,
            omNome: nextLevel.omNome,
          }
        : null,
      cadeiaAprovacao: approvalChain.map((n) => ({
        nivel: n.nivel,
        omSigla: n.omSigla,
        omNome: n.omNome,
        status:
          n.nivel < nivelAtual
            ? "aprovado"
            : n.nivel === nivelAtual
              ? acao === AcaoAprovacao.APROVADO
                ? "aprovado"
                : "reprovado"
              : "pendente",
      })),
    });
  } catch (error) {
    console.error("Approve plano error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
