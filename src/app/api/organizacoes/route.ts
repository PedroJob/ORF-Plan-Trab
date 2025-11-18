import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const organizacoes = await prisma.organizacaoMilitar.findMany({
      select: {
        id: true,
        nome: true,
        sigla: true,
        tipo: true,
        codUG: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(organizacoes);
  } catch (error) {
    console.error('Get organizacoes error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
