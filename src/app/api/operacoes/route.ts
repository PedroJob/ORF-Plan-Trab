import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canCreateOperacao, canViewAllPlanos } from '@/lib/permissions';
import { validarOmsParticipantes } from '@/lib/validators/om-participante';
import { z } from 'zod';
import { StatusPlano, Prioridade, TipoEvento } from '@prisma/client';

const omParticipanteSchema = z.object({
  omId: z.string().min(1, 'ID da OM é obrigatório'),
  valorLimite: z.number().positive('Valor limite deve ser positivo'),
});

const createOperacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  efetivoMil: z.number().int().positive('Efetivo deve ser positivo'),
  efetivoExt: z.number().int().positive('Efetivo deve ser positivo').optional(),
  dataInicio: z.string().datetime(),
  dataFinal: z.string().datetime(),
  prioridade: z.nativeEnum(Prioridade).optional(),
  finalidade: z.string().optional(),
  motivacao: z.string().optional(),
  consequenciaNaoAtendimento: z.string().optional(),
  observacoes: z.string().optional(),
  valorLimiteTotal: z.number().positive('Valor limite total deve ser positivo').optional(),
  omsParticipantes: z.array(omParticipanteSchema).optional(),
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
    // Usuário vê operações que criou OU que sua OM participa
    const whereClause = canViewAllPlanos(user.role)
      ? {} // SUPER_ADMIN e COMANDANTE veem todas
      : {
          OR: [
            { omId: user.omId }, // Criou a operação
            { omsParticipantes: { some: { omId: user.omId } } }, // Participa da operação
          ],
        };

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
        omsParticipantes: {
          include: {
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
        planosTrabalho: {
          select: {
            id: true,
            titulo: true,
            status: true,
            omId: true,
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

    // Calcular dias totais de operação
    const dataInicio = new Date(data.dataInicio);
    const dataFinal = new Date(data.dataFinal);
    const diffTime = dataFinal.getTime() - dataInicio.getTime();
    const diasTotais = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia inicial

    // Validar que soma dos valores das OMs não excede o limite total
    if (data.valorLimiteTotal && data.omsParticipantes && data.omsParticipantes.length > 0) {
      const somaValores = data.omsParticipantes.reduce((acc, om) => acc + om.valorLimite, 0);
      if (somaValores > data.valorLimiteTotal) {
        return NextResponse.json(
          {
            error: 'Soma dos valores das OMs participantes excede o valor limite total',
            details: {
              valorLimiteTotal: data.valorLimiteTotal,
              somaValoresOMs: somaValores,
            },
          },
          { status: 400 }
        );
      }
    }

    // Validar que OMs participantes são filhas diretas de CMA
    if (data.omsParticipantes && data.omsParticipantes.length > 0) {
      const omIds = data.omsParticipantes.map((om) => om.omId);
      const validacao = await validarOmsParticipantes(omIds);

      if (!validacao.valid) {
        // Buscar nomes das OMs inválidas para mensagem mais clara
        const omsInvalidas = await prisma.organizacaoMilitar.findMany({
          where: { id: { in: validacao.invalidOms } },
          select: { sigla: true, nome: true },
        });

        return NextResponse.json(
          {
            error: 'Apenas OMs filhas diretas de CMA podem ser participantes de operações',
            details: {
              omsInvalidas: omsInvalidas.map((om) => `${om.sigla} - ${om.nome}`),
            },
          },
          { status: 400 }
        );
      }
    }

    // Criar operação
    const operacao = await prisma.operacao.create({
      data: {
        nome: data.nome,
        efetivoMil: data.efetivoMil,
        efetivoExt: data.efetivoExt || null,
        dataInicio,
        dataFinal,
        diasTotais,
        prioridade: data.prioridade || Prioridade.MEDIA,
        status: StatusPlano.RASCUNHO,
        finalidade: data.finalidade,
        motivacao: data.motivacao,
        consequenciaNaoAtendimento: data.consequenciaNaoAtendimento,
        observacoes: data.observacoes,
        omId: user.omId,
        valorLimiteTotal: data.valorLimiteTotal,
      },
      include: {
        om: true,
      },
    });

    // Criar OMs participantes se fornecidas
    if (data.omsParticipantes && data.omsParticipantes.length > 0) {
      await prisma.operacaoOM.createMany({
        data: data.omsParticipantes.map((omPart) => ({
          operacaoId: operacao.id,
          omId: omPart.omId,
          valorLimite: omPart.valorLimite,
        })),
      });
    }

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
            efetivoMil: operacao.efetivoMil,
            efetivoExt: operacao.efetivoExt,
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
