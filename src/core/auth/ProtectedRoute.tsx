import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/core/lib/supabase'
import { RoleProvider } from './RoleProvider'
import { PasswordChangeGate } from './ForcePasswordChange'
import { UsernameContext } from './currentUser'
import { emailToUsername } from './username'
import type { Session } from '@supabase/supabase-js'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  return (
    <UsernameContext.Provider value={emailToUsername(session.user.email)}>
      <RoleProvider userId={session.user.id}>
        <PasswordChangeGate>{children}</PasswordChangeGate>
      </RoleProvider>
    </UsernameContext.Provider>
  )
}
