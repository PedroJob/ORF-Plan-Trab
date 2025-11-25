import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { StatusPlano, TipoEvento } from '@prisma/client';

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

    // Buscar plano com despesas
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        despesas: true,
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

    // Validar que o usuário é o responsável
    if (plano.responsavelId !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o responsável pelo plano pode enviá-lo para análise' },
        { status: 403 }
      );
    }

    // Validar status
    if (plano.status !== StatusPlano.RASCUNHO) {
      return NextResponse.json(
        { error: 'Apenas planos em rascunho podem ser enviados para análise' },
        { status: 400 }
      );
    }

    // Validar que tem pelo menos 1 despesa
    if (plano.despesas.length === 0) {
      return NextResponse.json(
        { error: 'O plano deve ter pelo menos uma despesa cadastrada antes de ser enviado para análise' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Atualizar plano para EM_ANALISE
    const updatedPlano = await prisma.planoTrabalho.update({
      where: { id },
      data: {
        status: StatusPlano.EM_ANALISE,
        nivelAprovacaoAtual: 1, // Nível 1 = CMT_OM
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
          proximoAprovador: 'CMT_OM',
          totalDespesas: plano.despesas.length,
          valorTotal: plano.valorTotalDespesas?.toString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      plano: updatedPlano,
      message: 'Plano enviado para análise com sucesso',
      proximoNivel: {
        nivel: 1,
        descricao: 'Aguardando aprovação do Comandante da OM',
      },
    });
  } catch (error) {
    console.error('Enviar plano para análise error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
