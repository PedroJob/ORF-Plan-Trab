import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { TipoEvento } from '@prisma/client';

const updateUserSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode atualizar usuários
    if (currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar usuários' },
        { status: 403 }
      );
    }

    // Não pode desativar a si mesmo
    if (id === currentUser.userId) {
      return NextResponse.json(
        { error: 'Você não pode desativar sua própria conta' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { isActive } = validation.data;

    // Buscar usuário antes da atualização
    const userBefore = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        nomeCompleto: true,
        isActive: true,
      },
    });

    if (!userBefore) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        nomeCompleto: true,
        nomeGuerra: true,
        postoGraduacao: true,
        telefone: true,
        role: true,
        isActive: true,
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        createdAt: true,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: TipoEvento.EDICAO,
        descricao: `Usuário "${updatedUser.nomeCompleto}" (${updatedUser.email}) ${
          isActive ? 'ativado' : 'desativado'
        }`,
        usuarioId: currentUser.userId,
        metadados: {
          userId: id,
          before: { isActive: userBefore.isActive },
          after: { isActive },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
