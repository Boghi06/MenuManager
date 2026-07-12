import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useRole, type UserRole } from './roles'

interface RequireRoleProps {
  /** Ruoli ammessi alla route. */
  roles: UserRole[]
  children: ReactNode
}

/** Guardia di route: se il ruolo corrente non è ammesso, rimanda alla home. */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const role = useRole()
  if (!roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}
