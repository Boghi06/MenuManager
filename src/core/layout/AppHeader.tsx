import { clientConfig } from '@/config/clients'

export function AppHeader() {
  return (
    <header
      className="h-20 flex items-center justify-between px-8 py-4 shrink-0 bg-brand-surface"
    >
      <img src={clientConfig.logo} alt={clientConfig.appName} className="h-12 w-auto" />
      <div
        className="w-10 h-10 rounded-full text-white flex items-center justify-center text-2xl font-fraunces bg-brand-ink"
      >
        GG
      </div>
    </header>
  )
}
