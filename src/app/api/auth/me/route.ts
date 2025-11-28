import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { om: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nomeCompleto: user.nomeCompleto,
      nomeGuerra: user.nomeGuerra,
      postoGraduacao: user.postoGraduacao,
      role: user.role,
      om: {
        id: user.om.id,
        nome: user.om.nome,
        sigla: user.om.sigla,
        tipo: user.om.tipo,
        omPaiId: user.om.omPaiId,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
