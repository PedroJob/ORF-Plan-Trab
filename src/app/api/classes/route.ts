import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/classes
 * Lista todas as classes de despesa (para planos LOGISTICO)
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const classes = await prisma.classe.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        naturezasPermitidas: true,
        possuiCalculoAutomatizado: true,
        createdAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
