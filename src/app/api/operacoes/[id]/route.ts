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
        omsParticipantes: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                tipo: true,
              },
            },
          },
        },
        planosTrabalho: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Check if operation exists
    const operacao = await prisma.operacao.findUnique({
      where: { id },
    });

    if (!operacao) {
      return NextResponse.json(
        { error: 'Operação não encontrada' },
        { status: 404 }
      );
    }

    // Delete the operation (cascade delete will handle related records)
    await prisma.operacao.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Operação excluída com sucesso' });
  } catch (error) {
    console.error('Delete operacao error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
