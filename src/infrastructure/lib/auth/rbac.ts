import { UserRole } from '@/types'

const ROLE_hierarchy: Record<UserRole, number> = {
  super_admin: 4,
  school_admin: 3,
  validator: 2,
  host: 1
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_hierarchy[userRole] || 0
  const requiredLevel = ROLE_hierarchy[requiredRole] || 0
  return userLevel >= requiredLevel
}

export function canManageCampaigns(role: UserRole): boolean {
  return hasRole(role, 'host')
}

export function canReconcile(role: UserRole): boolean {
  return hasRole(role, 'validator') || hasRole(role, 'host')
}

export function canManageSchool(role: UserRole): boolean {
  return hasRole(role, 'school_admin')
}

export function canOnboardSchool(role: UserRole): boolean {
  return hasRole(role, 'super_admin')
}
