import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canCreateOperacao, canViewAllPlanos } from '@/lib/permissions';
import { z } from 'zod';
import { StatusPlano, Prioridade, TipoEvento } from '@prisma/client';

const createOperacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  efetivo: z.number().int().positive('Efetivo deve ser positivo'),
  dataInicio: z.string().datetime(),
  dataFinal: z.string().datetime(),
  prioridade: z.nativeEnum(Prioridade).optional(),
  finalidade: z.string().optional(),
  motivacao: z.string().optional(),
  consequenciaNaoAtendimento: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { om: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Filtrar operações baseado na hierarquia
    const whereClause = canViewAllPlanos(user.role)
      ? {} // Ver todas
      : { omId: user.omId }; // Ver apenas da sua OM

    const operacoes = await prisma.operacao.findMany({
      where: whereClause,
      include: {
        om: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
          },
        },
        planosTrabalho: {
          select: {
            id: true,
            titulo: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(operacoes);
  } catch (error) {
    console.error('Get operacoes error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user || !canCreateOperacao(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar operação' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createOperacaoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Criar operação
    const operacao = await prisma.operacao.create({
      data: {
        nome: data.nome,
        efetivo: data.efetivo,
        dataInicio: new Date(data.dataInicio),
        dataFinal: new Date(data.dataFinal),
        prioridade: data.prioridade || Prioridade.MEDIA,
        status: StatusPlano.RASCUNHO,
        finalidade: data.finalidade,
        motivacao: data.motivacao,
        consequenciaNaoAtendimento: data.consequenciaNaoAtendimento,
        observacoes: data.observacoes,
        omId: user.omId,
      },
      include: {
        om: true,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: TipoEvento.CRIACAO,
        descricao: `Operação "${operacao.nome}" criada`,
        usuarioId: user.id,
        operacaoId: operacao.id,
        metadados: {
          operacao: {
            nome: operacao.nome,
            efetivo: operacao.efetivo,
          },
        },
      },
    });

    return NextResponse.json(operacao, { status: 201 });
  } catch (error) {
    console.error('Create operacao error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
