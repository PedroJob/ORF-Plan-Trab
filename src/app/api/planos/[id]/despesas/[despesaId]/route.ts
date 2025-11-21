import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calcularDespesa } from '@/lib/calculos-despesas';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const rateioOMSchema = z.object({
  omId: z.string().cuid('ID de OM inválido'),
  percentual: z.number().min(0.01).max(100),
});

const updateDespesaSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').optional(),
  naturezas: z.array(z.string()).min(1, 'Selecione ao menos uma natureza').optional(),
  parametros: z.any().optional(),
  oms: z.array(rateioOMSchema).min(1, 'Selecione ao menos uma OM').optional(),
});

/**
 * DELETE /api/planos/[id]/despesas/[despesaId]
 * Exclui uma despesa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; despesaId: string }> }
) {
  try {
    const { id, despesaId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se despesa existe e pertence ao plano
    const despesa = await prisma.despesa.findFirst({
      where: {
        id: despesaId,
        planoTrabalhoId: id,
      },
      include: {
        planoTrabalho: true,
      },
    });

    if (!despesa) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (
      !user ||
      (despesa.planoTrabalho.responsavelId !== user.id &&
        !['CMT_OM', 'CMT_BRIGADA', 'CMT_CMA', 'SUPER_ADMIN'].includes(user.role))
    ) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta despesa' },
        { status: 403 }
      );
    }

    // Excluir despesa (cascade irá deletar DespesaOM automaticamente)
    await prisma.despesa.delete({
      where: { id: despesaId },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: 'EDICAO',
        descricao: `Despesa excluída do plano "${despesa.planoTrabalho.titulo}"`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        metadados: {
          despesaId,
          descricao: despesa.descricao,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete despesa error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/planos/[id]/despesas/[despesaId]
 * Atualiza uma despesa
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; despesaId: string }> }
) {
  try {
    const { id, despesaId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se despesa existe
    const despesa = await prisma.despesa.findFirst({
      where: {
        id: despesaId,
        planoTrabalhoId: id,
      },
      include: {
        planoTrabalho: true,
        classe: true,
        tipo: true,
      },
    });

    if (!despesa) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (
      !user ||
      (despesa.planoTrabalho.responsavelId !== user.id &&
        !['CMT_OM', 'CMT_BRIGADA', 'CMT_CMA', 'SUPER_ADMIN'].includes(user.role))
    ) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta despesa' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateDespesaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { descricao, naturezas, parametros, oms } = validation.data;

    // Validar naturezas se fornecidas
    if (naturezas) {
      const naturezasInvalidas = naturezas.filter(
        (nat) => !despesa.classe.naturezasPermitidas.includes(nat)
      );

      if (naturezasInvalidas.length > 0) {
        return NextResponse.json(
          {
            error: `Naturezas não permitidas para esta classe: ${naturezasInvalidas.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Validar rateio de OMs se fornecido
    if (oms) {
      const somaPercentuais = oms.reduce((sum, om) => sum + om.percentual, 0);
      if (Math.abs(somaPercentuais - 100) > 0.01) {
        return NextResponse.json(
          { error: `A soma dos percentuais deve ser 100%. Soma atual: ${somaPercentuais}%` },
          { status: 400 }
        );
      }

      // Validar que todas as OMs existem
      const omIds = oms.map((om) => om.omId);
      const omsExistentes = await prisma.organizacaoMilitar.findMany({
        where: { id: { in: omIds } },
      });

      if (omsExistentes.length !== omIds.length) {
        return NextResponse.json(
          { error: 'Uma ou mais OMs não foram encontradas' },
          { status: 404 }
        );
      }
    }

    // Recalcular valores se parâmetros mudaram
    let valorCalculado = despesa.valorCalculado;
    let valorCombustivel = despesa.valorCombustivel;

    if (parametros) {
      try {
        const resultado = calcularDespesa(despesa.classe.nome, parametros);
        valorCalculado = new Prisma.Decimal(resultado.valorTotal);
        valorCombustivel = resultado.valorCombustivel ? new Prisma.Decimal(resultado.valorCombustivel) : null;
      } catch (error: any) {
        return NextResponse.json(
          { error: `Erro no cálculo: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Atualizar despesa
    const despesaAtualizada = await prisma.despesa.update({
      where: { id: despesaId },
      data: {
        ...(descricao && { descricao }),
        ...(naturezas && { naturezas }),
        ...(parametros && {
          parametros: parametros as Prisma.JsonValue,
          valorCalculado,
          valorCombustivel,
        }),
        ...(oms && {
          despesaOM: {
            deleteMany: {},
            create: oms.map((om) => ({
              omId: om.omId,
              percentual: om.percentual,
            })),
          },
        }),
      },
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
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: 'EDICAO',
        descricao: `Despesa atualizada no plano "${despesa.planoTrabalho.titulo}"`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        metadados: {
          despesaId,
          classe: despesa.classe.nome,
          camposAlterados: Object.keys(validation.data).filter(
            (k) => validation.data[k as keyof typeof validation.data] !== undefined
          ),
        },
      },
    });

    return NextResponse.json(despesaAtualizada);
  } catch (error) {
    console.error('Update despesa error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
