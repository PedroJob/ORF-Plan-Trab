import { prisma } from "@/lib/prisma";
import { TipoOM } from "@prisma/client";

/**
 * Representa um nível na cadeia de aprovação hierárquica
 */
export interface NivelAprovacao {
  nivel: number;
  omId: string;
  omSigla: string;
  omNome: string;
  omTipo: TipoOM;
}

/**
 * Obtém a cadeia completa de aprovação para uma OM,
 * começando pela própria OM (nível 1) e subindo até o topo da hierarquia.
 *
 * @param omId - ID da OM de origem (a que criou o plano)
 * @returns Array ordenado de níveis de aprovação
 */
export async function getApprovalChain(omId: string): Promise<NivelAprovacao[]> {
  const chain: NivelAprovacao[] = [];
  let currentOmId: string | null = omId;
  let nivel = 1;

  while (currentOmId) {
    const om: {
      id: string;
      sigla: string;
      nome: string;
      tipo: TipoOM;
      omPaiId: string | null;
    } | null = await prisma.organizacaoMilitar.findUnique({
      where: { id: currentOmId },
      select: {
        id: true,
        sigla: true,
        nome: true,
        tipo: true,
        omPaiId: true,
      },
    });

    if (!om) break;

    chain.push({
      nivel,
      omId: om.id,
      omSigla: om.sigla,
      omNome: om.nome,
      omTipo: om.tipo,
    });

    currentOmId = om.omPaiId;
    nivel++;
  }

  return chain;
}

/**
 * Obtém o próximo nível de aprovação após o nível atual.
 *
 * @param currentLevel - Nível atual de aprovação (1-based)
 * @param chain - Cadeia completa de aprovação
 * @returns Próximo nível ou null se já é o último
 */
export function getNextApprovalLevel(
  currentLevel: number,
  chain: NivelAprovacao[]
): NivelAprovacao | null {
  const nextLevel = chain.find((n) => n.nivel === currentLevel + 1);
  return nextLevel || null;
}

/**
 * Verifica se o nível atual é o último da cadeia de aprovação.
 *
 * @param currentLevel - Nível atual de aprovação (1-based)
 * @param chain - Cadeia completa de aprovação
 * @returns true se é o último nível
 */
export function isFinalApprovalLevel(
  currentLevel: number,
  chain: NivelAprovacao[]
): boolean {
  return currentLevel >= chain.length;
}

/**
 * Obtém o nível de aprovação atual da cadeia.
 *
 * @param currentLevel - Nível atual de aprovação (1-based)
 * @param chain - Cadeia completa de aprovação
 * @returns O nível atual ou null se inválido
 */
export function getCurrentApprovalLevel(
  currentLevel: number,
  chain: NivelAprovacao[]
): NivelAprovacao | null {
  return chain.find((n) => n.nivel === currentLevel) || null;
}

/**
 * Verifica se um usuário pode aprovar um plano no nível atual.
 * O usuário deve ser S4 da OM correspondente ao nível atual.
 *
 * @param userId - ID do usuário
 * @param planoOmId - ID da OM dona do plano
 * @param nivelAtual - Nível atual de aprovação do plano
 * @returns true se o usuário pode aprovar
 */
export async function canUserApprove(
  userId: string,
  planoOmId: string,
  nivelAtual: number
): Promise<boolean> {
  // Buscar o usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      omId: true,
    },
  });

  if (!user) return false;

  // SUPER_ADMIN pode aprovar em qualquer nível
  if (user.role === "SUPER_ADMIN") return true;

  // Apenas S4 pode aprovar
  if (user.role !== "S4") return false;

  // Obter a cadeia de aprovação
  const chain = await getApprovalChain(planoOmId);

  // Verificar se a OM do usuário corresponde ao nível atual
  const currentLevel = getCurrentApprovalLevel(nivelAtual, chain);
  if (!currentLevel) return false;

  return user.omId === currentLevel.omId;
}

/**
 * Formata a cadeia de aprovação para exibição no frontend.
 *
 * @param chain - Cadeia de aprovação
 * @param nivelAtual - Nível atual de aprovação (opcional)
 * @returns Array formatado para exibição
 */
export function formatApprovalChainForDisplay(
  chain: NivelAprovacao[],
  nivelAtual?: number | null
): Array<{
  nivel: number;
  omSigla: string;
  omNome: string;
  status: "aprovado" | "atual" | "pendente";
}> {
  return chain.map((nivel) => ({
    nivel: nivel.nivel,
    omSigla: nivel.omSigla,
    omNome: nivel.omNome,
    status:
      nivelAtual === null || nivelAtual === undefined
        ? "pendente"
        : nivel.nivel < nivelAtual
          ? "aprovado"
          : nivel.nivel === nivelAtual
            ? "atual"
            : "pendente",
  }));
}

/**
 * Verifica se uma OM participa de uma operação.
 *
 * @param operacaoId - ID da operação
 * @param omId - ID da OM
 * @returns true se a OM participa da operação
 */
export async function isOmParticipatingInOperation(
  operacaoId: string,
  omId: string
): Promise<boolean> {
  const participation = await prisma.operacaoOM.findUnique({
    where: {
      operacaoId_omId: {
        operacaoId,
        omId,
      },
    },
  });

  return participation !== null;
}

/**
 * Obtém o valor limite de uma OM em uma operação.
 *
 * @param operacaoId - ID da operação
 * @param omId - ID da OM
 * @returns Valor limite ou null se a OM não participa
 */
export async function getOmValueLimit(
  operacaoId: string,
  omId: string
): Promise<number | null> {
  const participation = await prisma.operacaoOM.findUnique({
    where: {
      operacaoId_omId: {
        operacaoId,
        omId,
      },
    },
    select: {
      valorLimite: true,
    },
  });

  if (!participation) return null;

  return Number(participation.valorLimite);
}

/**
 * Verifica se o valor total de um plano excede o limite da OM.
 *
 * @param operacaoId - ID da operação
 * @param omId - ID da OM
 * @param valorTotal - Valor total do plano
 * @returns Objeto com resultado da validação
 */
export async function validatePlanValueAgainstLimit(
  operacaoId: string,
  omId: string,
  valorTotal: number
): Promise<{
  isValid: boolean;
  valorLimite: number | null;
  excedente: number;
  percentualUtilizado: number;
}> {
  const valorLimite = await getOmValueLimit(operacaoId, omId);

  if (valorLimite === null) {
    return {
      isValid: false,
      valorLimite: null,
      excedente: 0,
      percentualUtilizado: 0,
    };
  }

  const excedente = Math.max(0, valorTotal - valorLimite);
  const percentualUtilizado =
    valorLimite > 0 ? (valorTotal / valorLimite) * 100 : 0;

  return {
    isValid: valorTotal <= valorLimite,
    valorLimite,
    excedente,
    percentualUtilizado: Math.min(percentualUtilizado, 100),
  };
}
