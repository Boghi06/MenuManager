import { clientConfig } from '@/config/clients'
import { useUsername } from '@/core/auth/currentUser'

export function AppHeader() {
  const username = useUsername()
  const iniziale = username.trim().charAt(0).toUpperCase() || '?'

  return (
    <header
      className="h-20 flex items-center justify-between px-8 py-4 shrink-0 bg-brand-surface"
    >
      <img src={clientConfig.logo} alt={clientConfig.appName} className="h-12 w-auto" />
      <div
        title={username}
        className="w-10 h-10 rounded-full text-white flex items-center justify-center text-2xl font-fraunces bg-brand-ink"
      >
        {iniziale}
      </div>
    </header>
  )
}
