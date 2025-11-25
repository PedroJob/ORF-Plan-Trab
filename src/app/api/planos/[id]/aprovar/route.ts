import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  canApproveAtLevel,
  isFinalApprovalLevel,
  getApprovalLevelName
} from '@/lib/permissions';
import { z } from 'zod';
import { StatusPlano, AcaoAprovacao, TipoEvento } from '@prisma/client';

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
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { om: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar plano
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        operacao: {
          include: { om: true },
        },
      },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de trabalho não encontrado' },
        { status: 404 }
      );
    }

    if (plano.status !== StatusPlano.EM_ANALISE) {
      return NextResponse.json(
        { error: 'Plano não está em análise' },
        { status: 400 }
      );
    }

    // Validar nível de aprovação atual
    if (!plano.nivelAprovacaoAtual) {
      return NextResponse.json(
        { error: 'Nível de aprovação não definido no plano' },
        { status: 400 }
      );
    }

    // Validar se usuário pode aprovar neste nível
    if (!canApproveAtLevel(user.role, plano.nivelAprovacaoAtual)) {
      return NextResponse.json(
        {
          error: `Sem permissão para aprovar neste nível. Aguardando aprovação de: ${getApprovalLevelName(plano.nivelAprovacaoAtual)}`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { acao, motivo } = validation.data;

    // Validar motivo obrigatório para reprovação
    if (acao === AcaoAprovacao.REPROVADO && !motivo) {
      return NextResponse.json(
        { error: 'Motivo é obrigatório para reprovação' },
        { status: 400 }
      );
    }

    const nivelAtual = plano.nivelAprovacaoAtual!;

    // Registrar aprovação/reprovação com nível hierárquico
    await prisma.aprovacaoHistorico.create({
      data: {
        acao,
        motivo,
        nivelHierarquico: nivelAtual,
        planoTrabalhoId: id,
        aprovadorId: user.id,
        omNivelId: user.omId,
      },
    });

    let newStatus: StatusPlano;
    let newNivel: number | null;

    if (acao === AcaoAprovacao.APROVADO) {
      // Verificar se é aprovação final
      if (isFinalApprovalLevel(nivelAtual)) {
        newStatus = StatusPlano.APROVADO;
        newNivel = null; // Limpa o nível após aprovação final
      } else {
        // Continua em análise para próximo nível
        newStatus = StatusPlano.EM_ANALISE;
        newNivel = nivelAtual + 1;
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
        dataBloqueio: newStatus === StatusPlano.EM_ANALISE ? plano.dataBloqueio : null,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: acao === AcaoAprovacao.APROVADO ? TipoEvento.APROVACAO : TipoEvento.REPROVACAO,
        descricao: `Plano "${plano.titulo}" ${acao === AcaoAprovacao.APROVADO ? 'aprovado' : 'reprovado'} por ${user.postoGraduacao} ${user.nomeCompleto} (Nível ${nivelAtual}: ${getApprovalLevelName(nivelAtual)})`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        operacaoId: plano.operacaoId,
        metadados: {
          acao,
          motivo,
          nivelHierarquico: nivelAtual,
          nomeNivel: getApprovalLevelName(nivelAtual),
          omNivel: user.om.nome,
          statusAnterior: plano.status,
          statusNovo: newStatus,
          proximoNivel: newNivel,
        },
      },
    });

    return NextResponse.json({
      success: true,
      plano: updatedPlano,
      message: acao === AcaoAprovacao.APROVADO
        ? (isFinalApprovalLevel(nivelAtual)
          ? 'Plano aprovado com sucesso! Todas as aprovações foram concluídas.'
          : `Plano aprovado no nível ${nivelAtual}. Aguardando aprovação de: ${getApprovalLevelName(newNivel!)}`)
        : 'Plano reprovado. O responsável poderá fazer correções e reenviar.',
      proximoNivel: newNivel
        ? {
            nivel: newNivel,
            descricao: getApprovalLevelName(newNivel),
          }
        : null,
    });
  } catch (error) {
    console.error('Approve plano error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
