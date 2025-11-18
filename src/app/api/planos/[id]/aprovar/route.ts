import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canApprove, getNextApprovalLevel, isApprovalComplete } from '@/lib/permissions';
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

    if (!user || !canApprove(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para aprovar' },
        { status: 403 }
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

    const body = await request.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { acao, motivo } = validation.data;

    // Registrar aprovação/reprovação
    await prisma.aprovacaoHistorico.create({
      data: {
        acao,
        motivo,
        planoTrabalhoId: id,
        aprovadorId: user.id,
        omNivelId: user.omId,
      },
    });

    let newStatus: StatusPlano = plano.status;

    if (acao === AcaoAprovacao.APROVADO) {
      // Verificar se é aprovação final
      if (isApprovalComplete(user.om.tipo)) {
        newStatus = StatusPlano.APROVADO;
      } else {
        // Continua em análise para próximo nível
        newStatus = StatusPlano.EM_ANALISE;
      }
    } else {
      // Reprovado
      newStatus = StatusPlano.REPROVADO;
    }

    // Atualizar status do plano
    const updatedPlano = await prisma.planoTrabalho.update({
      where: { id },
      data: { status: newStatus },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: acao === AcaoAprovacao.APROVADO ? TipoEvento.APROVACAO : TipoEvento.REPROVACAO,
        descricao: `Plano "${plano.titulo}" ${acao === AcaoAprovacao.APROVADO ? 'aprovado' : 'reprovado'} por ${user.postoGraduacao} ${user.nomeCompleto}`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        operacaoId: plano.operacaoId,
        metadados: {
          acao,
          motivo,
          omNivel: user.om.nome,
          statusAnterior: plano.status,
          statusNovo: newStatus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      plano: updatedPlano,
      nextLevel: acao === AcaoAprovacao.APROVADO ? getNextApprovalLevel(user.om.tipo) : null,
    });
  } catch (error) {
    console.error('Approve plano error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
