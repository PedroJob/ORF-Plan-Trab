import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar plano para validar acesso
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Buscar histórico de aprovações
    const historico = await prisma.aprovacaoHistorico.findMany({
      where: { planoTrabalhoId: id },
      include: {
        aprovador: {
          select: {
            postoGraduacao: true,
            nomeCompleto: true,
            nomeGuerra: true,
            role: true,
          },
        },
        omNivel: {
          select: {
            nome: true,
            sigla: true,
          },
        },
      },
      orderBy: { dataAcao: 'asc' },
    });

    return NextResponse.json(historico);
  } catch (error) {
    console.error('Get histórico error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
