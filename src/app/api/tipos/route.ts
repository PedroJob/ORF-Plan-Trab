import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createTipoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  classeId: z.string().cuid('ID de classe inválido'),
});

/**
 * POST /api/tipos
 * Cria um novo tipo customizado (apenas se isCriavelUsuario=true na classe)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão (CMT ou superior)
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user || !['S4', 'COMANDANTE', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar tipos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createTipoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { nome, classeId } = validation.data;

    // Verificar se a classe existe
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { error: 'Classe não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe um tipo com o mesmo nome nesta classe
    const tipoExistente = await prisma.tipo.findFirst({
      where: {
        nome,
        classeId,
      },
    });

    if (tipoExistente) {
      return NextResponse.json(
        { error: 'Já existe um tipo com este nome nesta classe' },
        { status: 409 }
      );
    }

    // Criar o tipo
    const novoTipo = await prisma.tipo.create({
      data: {
        nome,
        classeId,
        isCombustivel: false, // Tipos customizados nunca são combustível
        isCriavelUsuario: true,
      },
      include: {
        classe: {
          select: {
            nome: true,
            descricao: true,
          },
        },
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: 'CRIACAO',
        descricao: `Tipo "${nome}" criado na classe ${classe.nome}`,
        usuarioId: user.id,
        metadados: {
          tipoId: novoTipo.id,
          classeId: classe.id,
          className: classe.nome,
        },
      },
    });

    return NextResponse.json(novoTipo, { status: 201 });
  } catch (error) {
    console.error('Create tipo error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
