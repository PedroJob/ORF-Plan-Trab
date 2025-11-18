import { Role, TipoOM } from '@prisma/client';

export function canCreateOperacao(role: Role): boolean {
  const allowedRoles: Role[] = [Role.CMT_OM, Role.CMT_BRIGADA, Role.CMT_CMA, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

export function canCreatePlanoTrabalho(role: Role): boolean {
  const allowedRoles: Role[] = [Role.INTEGRANTE_OM, Role.CMT_OM, Role.CMT_BRIGADA, Role.INTEGRANTE_CMA, Role.CMT_CMA, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

export function canApprove(role: Role): boolean {
  const allowedRoles: Role[] = [Role.CMT_OM, Role.CMT_BRIGADA, Role.CMT_CMA, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

export function canViewAllPlanos(role: Role): boolean {
  const allowedRoles: Role[] = [Role.CMT_BRIGADA, Role.CMT_CMA, Role.SUPER_ADMIN];
  return allowedRoles.includes(role);
}

export function getNextApprovalLevel(currentOmType: TipoOM): TipoOM | null {
  const hierarchy = [TipoOM.COMPANHIA, TipoOM.BATALHAO, TipoOM.BRIGADA, TipoOM.CMA, TipoOM.COTER];
  const currentIndex = hierarchy.indexOf(currentOmType);

  if (currentIndex === -1 || currentIndex === hierarchy.length - 1) {
    return null; // Já está no topo ou tipo inválido
  }

  return hierarchy[currentIndex + 1];
}

export function isApprovalComplete(currentOmType: TipoOM): boolean {
  return currentOmType === TipoOM.COTER;
}
