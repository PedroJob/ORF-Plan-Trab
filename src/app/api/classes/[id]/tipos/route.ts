import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/classes/[id]/tipos
 * Lista todos os tipos de uma classe específica
 */
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

    // Verificar se a classe existe
    const classe = await prisma.classe.findUnique({
      where: { id },
    });

    if (!classe) {
      return NextResponse.json(
        { error: 'Classe não encontrada' },
        { status: 404 }
      );
    }

    // Buscar tipos da classe
    const tipos = await prisma.tipo.findMany({
      where: { classeId: id },
      select: {
        id: true,
        nome: true,
        isCombustivel: true,
        isCriavelUsuario: true,
        createdAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(tipos);
  } catch (error) {
    console.error('Get tipos error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
