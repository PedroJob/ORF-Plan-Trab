import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TipoOM } from "@prisma/client";

/**
 * GET /api/organizacoes/elegiveis-participantes
 * Retorna apenas OMs que são filhas diretas de CMA.
 * Estas são as únicas OMs elegíveis para serem participantes de operações.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar OMs que são filhas diretas de CMA
    const organizacoes = await prisma.organizacaoMilitar.findMany({
      where: {
        omPai: {
          tipo: TipoOM.CMA,
        },
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
        tipo: true,
        codUG: true,
        omPai: {
          select: {
            sigla: true,
            nome: true,
          },
        },
      },
      orderBy: {
        sigla: "asc",
      },
    });

    return NextResponse.json(organizacoes);
  } catch (error) {
    console.error("Get organizacoes elegiveis error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
