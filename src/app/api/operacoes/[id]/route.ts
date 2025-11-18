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

    const operacao = await prisma.operacao.findUnique({
      where: { id },
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        planosTrabalho: {
          include: {
            responsavel: {
              select: {
                id: true,
                nomeCompleto: true,
                nomeGuerra: true,
                postoGraduacao: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!operacao) {
      return NextResponse.json(
        { error: 'Operação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(operacao);
  } catch (error) {
    console.error('Get operacao error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
