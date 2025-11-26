import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StatusPlano, TipoEvento } from "@prisma/client";
import {
  getApprovalChain,
  validatePlanValueAgainstLimit,
} from "@/lib/approval-chain";

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

    // Buscar plano com despesas e OMs participantes
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        despesas: true,
        om: true,
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
      },
    });

    if (!plano) {
      return NextResponse.json(
        { error: "Plano de trabalho não encontrado" },
        { status: 404 }
      );
    }

    // Validar que o usuário pode enviar (responsável ou S4 da OM)
    const canSend =
      plano.responsavelId === user.id ||
      (user.role === "S4" && user.omId === plano.omId) ||
      user.role === "SUPER_ADMIN";

    if (!canSend) {
      return NextResponse.json(
        { error: "Sem permissão para enviar este plano para análise" },
        { status: 403 }
      );
    }

    // Validar status
    if (plano.status !== StatusPlano.RASCUNHO) {
      return NextResponse.json(
        { error: "Apenas planos em rascunho podem ser enviados para análise" },
        { status: 400 }
      );
    }

    // Validar que tem pelo menos 1 despesa
    if (plano.despesas.length === 0) {
      return NextResponse.json(
        {
          error:
            "O plano deve ter pelo menos uma despesa cadastrada antes de ser enviado para análise",
        },
        { status: 400 }
      );
    }

    // Validar valor contra limite da OM na operação
    const valorTotal = Number(plano.valorTotalDespesas || 0);
    const validacao = await validatePlanValueAgainstLimit(
      plano.operacaoId,
      plano.omId,
      valorTotal
    );

    if (!validacao.isValid) {
      return NextResponse.json(
        {
          error: "Valor do plano excede o limite alocado para sua OM",
          details: {
            valorPlano: valorTotal,
            valorLimite: validacao.valorLimite,
            excedente: validacao.excedente,
            percentualUtilizado: validacao.percentualUtilizado,
          },
        },
        { status: 400 }
      );
    }

    // Obter cadeia de aprovação hierárquica
    const approvalChain = await getApprovalChain(plano.omId);
    const primeiroNivel = approvalChain[0];

    const now = new Date();

    // Atualizar plano para EM_ANALISE
    const updatedPlano = await prisma.planoTrabalho.update({
      where: { id },
      data: {
        status: StatusPlano.EM_ANALISE,
        nivelAprovacaoAtual: 1, // Começa no nível 1 (S4 da própria OM)
        dataEnvioAnalise: now,
        dataBloqueio: now,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: TipoEvento.ENVIO_ANALISE,
        descricao: `Plano "${plano.titulo}" enviado para análise por ${user.postoGraduacao} ${user.nomeCompleto}`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        operacaoId: plano.operacaoId,
        metadados: {
          statusAnterior: StatusPlano.RASCUNHO,
          statusNovo: StatusPlano.EM_ANALISE,
          nivelAprovacao: 1,
          proximoAprovador: `S4 - ${primeiroNivel?.omSigla || plano.om.sigla}`,
          totalDespesas: plano.despesas.length,
          valorTotal: valorTotal.toString(),
          valorLimite: validacao.valorLimite?.toString(),
          percentualUtilizado: validacao.percentualUtilizado,
          cadeiaAprovacao: approvalChain.map((n) => ({
            nivel: n.nivel,
            om: n.omSigla,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      plano: updatedPlano,
      message: "Plano enviado para análise com sucesso",
      proximoNivel: {
        nivel: 1,
        descricao: `Aguardando aprovação do S4 - ${primeiroNivel?.omSigla || plano.om.sigla}`,
        omId: primeiroNivel?.omId,
      },
      cadeiaAprovacao: approvalChain.map((n) => ({
        nivel: n.nivel,
        omSigla: n.omSigla,
        omNome: n.omNome,
      })),
      validacaoValor: {
        valorPlano: valorTotal,
        valorLimite: validacao.valorLimite,
        percentualUtilizado: validacao.percentualUtilizado,
      },
    });
  } catch (error) {
    console.error("Enviar plano para análise error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
