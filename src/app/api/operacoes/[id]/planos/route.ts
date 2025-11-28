import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: operacaoId } = await params;

    // Busca todos os planos de trabalho da operação
    const planos = await prisma.planoTrabalho.findMany({
      where: {
        operacaoId,
      },
      include: {
        om: true,
        operacao: true,
        responsavel: true,
        despesas: {
          include: {
            classe: true,
            tipo: true,
            oms: { include: { om: true } },
            despesasNaturezas: { include: { natureza: true } },
          },
        },
      },
      orderBy: {
        om: { sigla: "asc" },
      },
    });

    // Busca a operação com suas relações
    const operacao = await prisma.operacao.findUnique({
      where: { id: operacaoId },
      include: {
        om: true,
      },
    });

    if (!operacao) {
      return NextResponse.json(
        { error: "Operação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      planos,
      operacao,
    });
  } catch (error) {
    console.error("Erro ao buscar planos da operação:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos da operação" },
      { status: 500 }
    );
  }
}
