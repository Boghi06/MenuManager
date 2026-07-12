import { createContext, useContext } from 'react'

/** Nome utente dell'utente loggato, esposto da ProtectedRoute (route protette). */
export const UsernameContext = createContext<string>('')

/** Nome utente corrente (stringa vuota fuori dalle route protette). */
export function useUsername(): string {
  return useContext(UsernameContext)
}
