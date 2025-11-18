import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const naturezas = await prisma.naturezaDespesa.findMany({
      select: {
        id: true,
        codigo: true,
        nome: true,
        descricao: true,
      },
      orderBy: {
        codigo: 'asc',
      },
    });

    return NextResponse.json(naturezas);
  } catch (error) {
    console.error('Get naturezas error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
