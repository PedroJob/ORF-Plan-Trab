import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/planos/[id]/itens
 * Lista todas as despesas de um plano (rota legada para compatibilidade)
 * NOTA: Para planos LOGISTICO, use /api/planos/[id]/despesas
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

    // Verificar se plano existe
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      select: { tipo: true },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Se for plano LOGISTICO, redirecionar para endpoint de despesas
    if (plano.tipo === 'LOGISTICO') {
      return NextResponse.json(
        {
          error: 'Para planos LOGISTICO, use o endpoint /api/planos/[id]/despesas',
          redirectTo: `/api/planos/${id}/despesas`
        },
        { status: 301 }
      );
    }

    // Para outros tipos de plano, buscar despesas básicas
    const despesas = await prisma.despesa.findMany({
      where: { planoTrabalhoId: id },
      include: {
        classe: {
          select: {
            nome: true,
            descricao: true,
          },
        },
        tipo: {
          select: {
            nome: true,
          },
        },
        oms: {
          include: {
            om: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                codUG: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error('Get itens error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/planos/[id]/itens
 * Rota deprecada - use /api/planos/[id]/despesas
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se plano existe
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      select: { tipo: true },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Este endpoint está deprecado
    return NextResponse.json(
      {
        error: 'Este endpoint está deprecado. Use /api/planos/[id]/despesas para criar despesas.',
        redirectTo: `/api/planos/${id}/despesas`
      },
      { status: 410 }
    );
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
