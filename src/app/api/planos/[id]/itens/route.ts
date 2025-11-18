import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createItemSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valorUnitario: z.number().positive('Valor unitário deve ser positivo'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  valorTotal: z.number().positive('Valor total deve ser positivo'),
  omId: z.string().cuid('ID de OM inválido'),
  naturezaId: z.string().cuid('ID de natureza inválido'),
});

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

    const itens = await prisma.itemFinanceiro.findMany({
      where: { planoTrabalhoId: id },
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            codUG: true,
          },
        },
        natureza: {
          select: {
            id: true,
            codigo: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(itens);
  } catch (error) {
    console.error('Get itens error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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

    // Verificar se plano existe e se usuário tem permissão
    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: { operacao: true },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de trabalho não encontrado' },
        { status: 404 }
      );
    }

    // Apenas responsável ou superior pode adicionar itens
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user || (plano.responsavelId !== user.id && !['CMT_OM', 'CMT_BRIGADA', 'CMT_CMA', 'SUPER_ADMIN'].includes(user.role))) {
      return NextResponse.json(
        { error: 'Sem permissão para adicionar itens' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Criar item financeiro
    const item = await prisma.itemFinanceiro.create({
      data: {
        descricao: data.descricao,
        valorUnitario: data.valorUnitario,
        quantidade: data.quantidade,
        valorTotal: data.valorTotal,
        planoTrabalhoId: id,
        omId: data.omId,
        naturezaId: data.naturezaId,
      },
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            codUG: true,
          },
        },
        natureza: {
          select: {
            id: true,
            codigo: true,
            nome: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
