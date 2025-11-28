import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodasOmsSubordinadas } from "@/lib/validators/om-participante";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: operacaoId } = await params;
    const { searchParams } = new URL(request.url);
    const omParticipanteId = searchParams.get("omParticipanteId");

    if (!omParticipanteId) {
      return NextResponse.json(
        { error: "omParticipanteId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca todas as OMs subordinadas da OM participante
    const subordinadas = await getTodasOmsSubordinadas(omParticipanteId);
    const subordinadasIds = subordinadas.map((om) => om.id);

    // Busca os planos de trabalho das OMs subordinadas para esta operação
    const planos = await prisma.planoTrabalho.findMany({
      where: {
        operacaoId,
        omId: { in: subordinadasIds },
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
    console.error("Erro ao buscar planos das subordinadas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos das subordinadas" },
      { status: 500 }
    );
  }
}
