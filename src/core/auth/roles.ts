import { createContext, useContext } from 'react'

/**
 * Ruoli applicativi. Il ruolo vive in public.user_roles (una riga per
 * utente, gestita a mano dalla dashboard Supabase); senza riga il
 * default è 'receptionist', il comportamento storico dell'app.
 */
export type UserRole = 'receptionist' | 'cucina' | 'admin'

export const USER_ROLES: readonly UserRole[] = ['receptionist', 'cucina', 'admin']

export const RoleContext = createContext<UserRole | null>(null)

/** Ruolo dell'utente corrente. Richiede RoleProvider (montato da ProtectedRoute). */
export function useRole(): UserRole {
  const role = useContext(RoleContext)
  if (role === null) {
    throw new Error('useRole va usato dentro RoleProvider (route protette)')
  }
  return role
}

/** Stato del cambio password obbligatorio al primo accesso. */
export interface PasswordChangeState {
  /** true finché l'utente non ha cambiato la password iniziale. */
  required: boolean
  /** Da chiamare dopo un cambio password riuscito per sbloccare l'app. */
  clear: () => void
}

export const PasswordChangeContext = createContext<PasswordChangeState>({
  required: false,
  clear: () => {},
})

/** Stato del cambio password obbligatorio (fornito da RoleProvider). */
export function usePasswordChange(): PasswordChangeState {
  return useContext(PasswordChangeContext)
}
