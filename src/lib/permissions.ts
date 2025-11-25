import { Role, TipoOM } from "@prisma/client";

export function canCreateOperacao(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.INTEGRANTE_OM,
    Role.INTEGRANTE_CMA,
    Role.CMT_OM,
    Role.CMT_BRIGADA,
    Role.CMT_CMA,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function canCreatePlanoTrabalho(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.INTEGRANTE_OM,
    Role.CMT_OM,
    Role.CMT_BRIGADA,
    Role.INTEGRANTE_CMA,
    Role.CMT_CMA,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function canApprove(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.CMT_OM,
    Role.CMT_BRIGADA,
    Role.CMT_CMA,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function canViewAllPlanos(role: Role): boolean {
  const allowedRoles: Role[] = [
    Role.CMT_BRIGADA,
    Role.CMT_CMA,
    Role.SUPER_ADMIN,
  ];
  return allowedRoles.includes(role);
}

export function getNextApprovalLevel(currentOmType: TipoOM): TipoOM | null {
  const hierarchy = [
    TipoOM.COMPANHIA,
    TipoOM.BATALHAO,
    TipoOM.BRIGADA,
    TipoOM.CMA,
    TipoOM.COTER,
  ];
  const currentIndex = hierarchy.indexOf(currentOmType);

  if (currentIndex === -1 || currentIndex === hierarchy.length - 1) {
    return null; // Já está no topo ou tipo inválido
  }

  return hierarchy[currentIndex + 1];
}

export function isApprovalComplete(currentOmType: TipoOM): boolean {
  return currentOmType === TipoOM.COTER;
}

/**
 * Mapeia nível hierárquico do workflow para role necessária
 * Níveis:
 * 1 = CMT_OM
 * 2 = CMT_BRIGADA
 * 3 = CMT_CMA (aprovação final)
 */
export function getRoleForApprovalLevel(nivel: number): Role | null {
  const nivelToRole: Record<number, Role> = {
    1: Role.CMT_OM,
    2: Role.CMT_BRIGADA,
    3: Role.CMT_CMA,
  };

  return nivelToRole[nivel] || null;
}

/**
 * Verifica se usuário pode aprovar no nível específico
 */
export function canApproveAtLevel(userRole: Role, nivel: number): boolean {
  const requiredRole = getRoleForApprovalLevel(nivel);

  if (!requiredRole) return false;

  // SUPER_ADMIN pode aprovar em qualquer nível
  if (userRole === Role.SUPER_ADMIN) return true;

  // Usuário deve ter exatamente a role requerida para o nível
  return userRole === requiredRole;
}

/**
 * Retorna o nome legível do nível de aprovação
 */
export function getApprovalLevelName(nivel: number): string {
  const names: Record<number, string> = {
    1: 'Comandante da OM',
    2: 'Comandante da Brigada',
    3: 'Comandante do CMA',
  };

  return names[nivel] || 'Desconhecido';
}

/**
 * Verifica se é o último nível de aprovação
 */
export function isFinalApprovalLevel(nivel: number): boolean {
  return nivel === 3; // CMT_CMA é o último nível
}
