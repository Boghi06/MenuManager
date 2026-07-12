import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
import { RoleContext, PasswordChangeContext, USER_ROLES, type UserRole } from './roles'

interface RoleProviderProps {
  userId: string
  children: ReactNode
}

/**
 * Carica ruolo e flag "cambio password" dell'utente da user_roles (la RLS
 * espone solo la propria riga). In caso di riga assente o errore (es.
 * migrazione non ancora applicata al DB del cliente) si ricade su
 * 'receptionist' e nessun cambio password forzato. Uso `select('*')` per non
 * rompersi se la colonna must_change_password non esiste ancora.
 */
export function RoleProvider({ userId, children }: RoleProviderProps) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [mustChange, setMustChange] = useState(false)

  useEffect(() => {
    let attivo = true
    supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!attivo) return
        if (error) console.error('Errore lettura ruolo, uso il default receptionist:', error)
        const r = data?.role as UserRole | undefined
        setRole(r && USER_ROLES.includes(r) ? r : 'receptionist')
        setMustChange(data?.must_change_password === true)
      })
    return () => { attivo = false }
  }, [userId])

  // Niente render finché il ruolo non è noto: evita il flash di voci di
  // navigazione o pulsanti che poi sparirebbero.
  if (role === null) return null
  return (
    <RoleContext.Provider value={role}>
      <PasswordChangeContext.Provider value={{ required: mustChange, clear: () => setMustChange(false) }}>
        {children}
      </PasswordChangeContext.Provider>
    </RoleContext.Provider>
  )
}
