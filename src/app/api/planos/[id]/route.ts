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

    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        operacao: {
          select: {
            id: true,
            nome: true,
            efetivoMil: true,
            efetivoExt: true,
            dataInicio: true,
            dataFinal: true,
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
        responsavel: {
          select: {
            id: true,
            nomeCompleto: true,
            nomeGuerra: true,
            postoGraduacao: true,
          },
        },
        despesas: {
          select: {
            id: true,
            valorCalculado: true,
          },
        },
        _count: {
          select: {
            despesas: true,
            documentosReferencia: true,
            anotacoes: true,
          },
        },
      },
    });

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(plano);
  } catch (error) {
    console.error('Get plano error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
