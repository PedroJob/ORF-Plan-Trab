import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/oms/[id]/subordinadas
 * Retorna as OMs subordinadas diretas de uma OM.
 * Inclui informação se a OM é "folha" (sem subordinadas).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se a OM existe
    const om = await prisma.organizacaoMilitar.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        sigla: true,
        tipo: true,
      },
    });

    if (!om) {
      return NextResponse.json({ error: "OM não encontrada" }, { status: 404 });
    }

    // Buscar subordinadas diretas com contagem de suas próprias subordinadas
    const subordinadas = await prisma.organizacaoMilitar.findMany({
      where: { omPaiId: id },
      select: {
        id: true,
        nome: true,
        sigla: true,
        tipo: true,
        _count: {
          select: {
            omsFilhas: true,
          },
        },
      },
      orderBy: { sigla: "asc" },
    });

    // Transformar para incluir flag isFolha
    const subordinadasComFolha = subordinadas.map((sub) => ({
      id: sub.id,
      nome: sub.nome,
      sigla: sub.sigla,
      tipo: sub.tipo,
      isFolha: sub._count.omsFilhas === 0,
      quantidadeSubordinadas: sub._count.omsFilhas,
    }));

    return NextResponse.json({
      omPai: om,
      subordinadas: subordinadasComFolha,
    });
  } catch (error) {
    console.error("Get subordinadas error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
