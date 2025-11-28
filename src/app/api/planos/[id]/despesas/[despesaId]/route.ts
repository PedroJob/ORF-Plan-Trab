import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calcularDespesa } from "@/lib/calculos-despesas";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const rateioOMSchema = z.object({
  omId: z.string().cuid("ID de OM inválido"),
  percentual: z.number().min(0.01).max(100),
});

const rateioNaturezaSchema = z.object({
  naturezaId: z.string().cuid("ID de natureza inválido"),
  percentual: z.number().min(0.01).max(100),
});

const updateDespesaSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória").optional(),
  naturezas: z
    .array(rateioNaturezaSchema)
    .min(1, "Selecione ao menos uma natureza")
    .optional(),
  parametros: z.any().optional(),
  oms: z.array(rateioOMSchema).min(1, "Selecione ao menos uma OM").optional(),
});

const putDespesaSchema = z.object({
  classeId: z.string().cuid("ID de classe inválido"),
  tipoId: z.string().cuid("ID de tipo inválido").nullable(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  parametros: z.any(),
  naturezas: z
    .array(rateioNaturezaSchema)
    .min(1, "Selecione ao menos uma natureza"),
  oms: z.array(rateioOMSchema).min(1, "Selecione ao menos uma OM"),
  valorTotal: z.number(),
  valorCombustivel: z.number().nullable().optional(),
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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar bloqueio (plano em análise)
    if (despesa.planoTrabalho.status === "EM_ANALISE") {
      return NextResponse.json(
        {
          error:
            "Plano em análise não pode ter despesas removidas. Aguardando aprovação.",
        },
        { status: 403 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // SUPER_ADMIN pode sempre excluir
    if (user.role !== "SUPER_ADMIN") {
      // Usuário deve pertencer à OM do plano
      if (user.omId !== despesa.planoTrabalho.omId) {
        return NextResponse.json(
          { error: "Você só pode excluir despesas de planos da sua OM" },
          { status: 403 }
        );
      }

      // Deve ser responsável, S4 ou COMANDANTE da OM
      if (
        despesa.planoTrabalho.responsavelId !== user.id &&
        !["S4", "COMANDANTE"].includes(user.role)
      ) {
        return NextResponse.json(
          { error: "Sem permissão para excluir esta despesa" },
          { status: 403 }
        );
      }
    }

    // Excluir despesa (cascade irá deletar DespesaOM automaticamente)
    await prisma.despesa.delete({
      where: { id: despesaId },
    });

    // Recalculate total for the plano
    const despesasTotal = await prisma.despesa.aggregate({
      where: { planoTrabalhoId: id },
      _sum: { valorCalculado: true },
    });

    await prisma.planoTrabalho.update({
      where: { id },
      data: {
        valorTotalDespesas: despesasTotal._sum.valorCalculado || 0,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: "EDICAO",
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
    console.error("Delete despesa error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se despesa existe
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
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = putDespesaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      classeId,
      tipoId,
      descricao,
      naturezas,
      parametros,
      oms,
      valorTotal,
      valorCombustivel,
    } = validation.data;

    // Validar que a classe existe
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe não encontrada" },
        { status: 404 }
      );
    }

    // Validar tipo se fornecido
    if (tipoId) {
      const tipo = await prisma.tipo.findFirst({
        where: {
          id: tipoId,
          classeId: classeId,
        },
      });

      if (!tipo) {
        return NextResponse.json(
          { error: "Tipo não encontrado ou não pertence à classe selecionada" },
          { status: 404 }
        );
      }
    }

    // Validar naturezas
    const somaPercentuaisNaturezas = naturezas.reduce(
      (sum, nat) => sum + nat.percentual,
      0
    );
    if (Math.abs(somaPercentuaisNaturezas - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `A soma dos percentuais de naturezas deve ser 100%. Soma atual: ${somaPercentuaisNaturezas}%`,
        },
        { status: 400 }
      );
    }

    const naturezaIds = naturezas.map((nat) => nat.naturezaId);
    const naturezasExistentes = await prisma.naturezaDespesa.findMany({
      where: { id: { in: naturezaIds } },
    });

    if (naturezasExistentes.length !== naturezaIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais naturezas não foram encontradas" },
        { status: 404 }
      );
    }

    // Validar naturezas (devem estar nas permitidas pela classe)
    const codigosNaturezas = naturezasExistentes.map((nat) => nat.codigo);
    const naturezasInvalidas = codigosNaturezas.filter(
      (codigo) => !classe.naturezasPermitidas.includes(codigo)
    );

    if (naturezasInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: `Naturezas não permitidas para esta classe: ${naturezasInvalidas.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validar rateio de OMs
    const somaPercentuais = oms.reduce((sum, om) => sum + om.percentual, 0);
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `A soma dos percentuais deve ser 100%. Soma atual: ${somaPercentuais}%`,
        },
        { status: 400 }
      );
    }

    const omIds = oms.map((om) => om.omId);
    const omsExistentes = await prisma.organizacaoMilitar.findMany({
      where: { id: { in: omIds } },
    });

    if (omsExistentes.length !== omIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais OMs não foram encontradas" },
        { status: 404 }
      );
    }

    // Atualizar despesa completamente
    const despesaAtualizada = await prisma.despesa.update({
      where: { id: despesaId },
      data: {
        classeId,
        tipoId,
        descricao,
        parametros: parametros as Prisma.InputJsonValue,
        valorCalculado: new Prisma.Decimal(valorTotal),
        valorCombustivel: valorCombustivel
          ? new Prisma.Decimal(valorCombustivel)
          : null,
        oms: {
          deleteMany: {},
          create: oms.map((om) => ({
            omId: om.omId,
            percentual: om.percentual,
          })),
        },
        despesasNaturezas: {
          deleteMany: {},
          create: naturezas.map((nat) => ({
            naturezaId: nat.naturezaId,
            percentual: nat.percentual,
          })),
        },
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
    });

    // Recalculate total for the plano
    const despesasTotal = await prisma.despesa.aggregate({
      where: { planoTrabalhoId: id },
      _sum: { valorCalculado: true },
    });

    await prisma.planoTrabalho.update({
      where: { id },
      data: {
        valorTotalDespesas: despesasTotal._sum.valorCalculado || 0,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: "EDICAO",
        descricao: `Despesa atualizada no plano "${despesa.planoTrabalho.titulo}"`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        metadados: {
          despesaId,
          classe: classe.nome,
          valorTotal: valorTotal,
        },
      },
    });

    return NextResponse.json(despesaAtualizada);
  } catch (error) {
    console.error("Update despesa error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/planos/[id]/despesas/[despesaId]
 * Substitui completamente uma despesa (permite alterar classe e tipo)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; despesaId: string }> }
) {
  try {
    const { id, despesaId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se despesa existe
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
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar permissão
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = putDespesaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      classeId,
      tipoId,
      descricao,
      naturezas,
      parametros,
      oms,
      valorTotal,
      valorCombustivel,
    } = validation.data;

    // Validar que a classe existe
    const classe = await prisma.classe.findUnique({
      where: { id: classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe não encontrada" },
        { status: 404 }
      );
    }

    // Validar tipo se fornecido
    if (tipoId) {
      const tipo = await prisma.tipo.findFirst({
        where: {
          id: tipoId,
          classeId: classeId,
        },
      });

      if (!tipo) {
        return NextResponse.json(
          { error: "Tipo não encontrado ou não pertence à classe selecionada" },
          { status: 404 }
        );
      }
    }

    // Validar naturezas
    const somaPercentuaisNaturezas = naturezas.reduce(
      (sum, nat) => sum + nat.percentual,
      0
    );
    if (Math.abs(somaPercentuaisNaturezas - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `A soma dos percentuais de naturezas deve ser 100%. Soma atual: ${somaPercentuaisNaturezas}%`,
        },
        { status: 400 }
      );
    }

    const naturezaIds = naturezas.map((nat) => nat.naturezaId);
    const naturezasExistentes = await prisma.naturezaDespesa.findMany({
      where: { id: { in: naturezaIds } },
    });

    if (naturezasExistentes.length !== naturezaIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais naturezas não foram encontradas" },
        { status: 404 }
      );
    }

    // Validar naturezas (devem estar nas permitidas pela classe)
    const codigosNaturezas = naturezasExistentes.map((nat) => nat.codigo);
    const naturezasInvalidas = codigosNaturezas.filter(
      (codigo) => !classe.naturezasPermitidas.includes(codigo)
    );

    if (naturezasInvalidas.length > 0) {
      return NextResponse.json(
        {
          error: `Naturezas não permitidas para esta classe: ${naturezasInvalidas.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validar rateio de OMs
    const somaPercentuais = oms.reduce((sum, om) => sum + om.percentual, 0);
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      return NextResponse.json(
        {
          error: `A soma dos percentuais deve ser 100%. Soma atual: ${somaPercentuais}%`,
        },
        { status: 400 }
      );
    }

    const omIds = oms.map((om) => om.omId);
    const omsExistentes = await prisma.organizacaoMilitar.findMany({
      where: { id: { in: omIds } },
    });

    if (omsExistentes.length !== omIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais OMs não foram encontradas" },
        { status: 404 }
      );
    }

    // Atualizar despesa completamente
    const despesaAtualizada = await prisma.despesa.update({
      where: { id: despesaId },
      data: {
        classeId,
        tipoId,
        descricao,
        parametros: parametros as Prisma.InputJsonValue,
        valorCalculado: new Prisma.Decimal(valorTotal),
        valorCombustivel: valorCombustivel
          ? new Prisma.Decimal(valorCombustivel)
          : null,
        oms: {
          deleteMany: {},
          create: oms.map((om) => ({
            omId: om.omId,
            percentual: om.percentual,
          })),
        },
        despesasNaturezas: {
          deleteMany: {},
          create: naturezas.map((nat) => ({
            naturezaId: nat.naturezaId,
            percentual: nat.percentual,
          })),
        },
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
    });

    // Recalculate total for the plano
    const despesasTotal = await prisma.despesa.aggregate({
      where: { planoTrabalhoId: id },
      _sum: { valorCalculado: true },
    });

    await prisma.planoTrabalho.update({
      where: { id },
      data: {
        valorTotalDespesas: despesasTotal._sum.valorCalculado || 0,
      },
    });

    // Log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        tipoEvento: "EDICAO",
        descricao: `Despesa completamente atualizada no plano "${despesa.planoTrabalho.titulo}"`,
        usuarioId: user.id,
        planoTrabalhoId: id,
        metadados: {
          despesaId,
          classe: classe.nome,
          mudancasCompletas: true,
        },
      },
    });

    return NextResponse.json(despesaAtualizada);
  } catch (error) {
    console.error("PUT despesa error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
