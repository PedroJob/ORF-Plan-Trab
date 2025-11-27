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

    // Verificar se deve incluir despesas completas (para PDF)
    const { searchParams } = new URL(request.url);
    const incluirDespesas = searchParams.get('incluirDespesas') === 'true';

    const plano = await prisma.planoTrabalho.findUnique({
      where: { id },
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
            codUG: true,
          },
        },
        operacao: {
          select: {
            id: true,
            nome: true,
            efetivoMil: true,
            efetivoExt: true,
            dataInicio: true,
            dataFinal: true,
            diasTotais: true,
            finalidade: true,
            motivacao: true,
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
        despesas: incluirDespesas ? {
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
                isCombustivel: true,
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
            despesasNaturezas: {
              include: {
                natureza: {
                  select: {
                    id: true,
                    codigo: true,
                    nome: true,
                    descricao: true,
                  },
                },
              },
            },
          },
        } : {
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
