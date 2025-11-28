import { Role } from "@prisma/client";

export function canCreateOperacao(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.INTEGRANTE,
    Role.S4,
    Role.COMANDANTE,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function canCreatePlanoTrabalho(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.INTEGRANTE,
    Role.S4,
    Role.COMANDANTE,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function canApprove(role: Role): boolean {
  // Apenas S4 e SUPER_ADMIN podem aprovar (COMANDANTE NÃO aprova)
  const allowedRoles: Role[] = [Role.S4, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

export function canViewAllPlanos(role: Role): boolean {
  // COMANDANTE e SUPER_ADMIN podem ver todos os planos
  const allowedRoles: Role[] = [Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

/**
 * Verifica se usuário pode aprovar baseado apenas na role.
 * A verificação completa (incluindo hierarquia de OM) é feita em canUserApprove do approval-chain.ts
 */
export function canApproveBasedOnRole(userRole: Role): boolean {
  // SUPER_ADMIN pode aprovar em qualquer nível
  if (userRole === Role.SUPER_ADMIN) return true;

  // Apenas S4 pode aprovar nos níveis hierárquicos
  return userRole === Role.S4;
}

/**
 * Retorna o nome legível do nível de aprovação
 * Agora os níveis são dinâmicos baseados na hierarquia de OMs
 */
export function getApprovalLevelName(nivel: number, omSigla?: string): string {
  if (omSigla) {
    return `S4 - ${omSigla}`;
  }
  return `Nível ${nivel}`;
}

/**
 * Verifica se uma OM pode definir OMs participantes de uma operação.
 * Apenas a OM criadora da operação pode definir os participantes.
 */
export function canDefineParticipants(
  userOmId: string,
  operacaoOmId: string,
  userRole: Role
): boolean {
  // SUPER_ADMIN pode sempre definir participantes
  if (userRole === Role.SUPER_ADMIN) return true;

  // Usuário deve pertencer à OM criadora da operação
  return userOmId === operacaoOmId;
}

/**
 * Verifica se usuário pode criar plano para uma operação.
 * Usuário deve pertencer a uma OM que participa da operação.
 */
export function canCreatePlanoForOperacao(
  userRole: Role,
  userOmParticipates: boolean
): boolean {
  // SUPER_ADMIN pode criar plano em qualquer operação
  if (userRole === Role.SUPER_ADMIN) return true;

  // Verifica se tem permissão básica de criar plano
  if (!canCreatePlanoTrabalho(userRole)) return false;

  // Usuário deve pertencer a uma OM participante
  return userOmParticipates;
}

/**
 * Verifica se usuário pode editar um plano.
 * Apenas o responsável, S4 da OM ou SUPER_ADMIN podem editar.
 */
export function canEditPlano(
  userRole: Role,
  userId: string,
  planoResponsavelId: string,
  userOmId: string,
  planoOmId: string
): boolean {
  // SUPER_ADMIN pode editar qualquer plano
  if (userRole === Role.SUPER_ADMIN) return true;

  // Responsável pelo plano pode editar
  if (userId === planoResponsavelId) return true;

  // S4 da OM dona do plano pode editar
  if (userRole === Role.S4 && userOmId === planoOmId) return true;

  return false;
}

/**
 * Verifica se usuário pode enviar plano para análise.
 */
export function canSendToAnalysis(
  userRole: Role,
  userId: string,
  planoResponsavelId: string,
  userOmId: string,
  planoOmId: string
): boolean {
  // Mesmas regras de edição
  return canEditPlano(
    userRole,
    userId,
    planoResponsavelId,
    userOmId,
    planoOmId
  );
}

/**
 * Verifica se usuário pode ver operações de outras OMs.
 */
export function canViewOtherOmsOperations(role: Role): boolean {
  const allowedRoles: Role[] = [Role.S4, Role.COMANDANTE, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

/**
 * Verifica se usuário pode ver todos os planos de uma operação
 * (não apenas os da sua OM).
 */
export function canViewAllPlanosOfOperation(
  userRole: Role,
  userOmId: string,
  operacaoOmId: string
): boolean {
  // SUPER_ADMIN vê todos
  if (userRole === Role.SUPER_ADMIN || userOmId === operacaoOmId) return true;

  return false;
}
