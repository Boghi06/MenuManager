import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  /** Contenuto extra renderizzato nella sidebar sotto la navigazione */
  sidebarExtra?: ReactNode
  children: ReactNode
}

export function AppLayout({ sidebarExtra, children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden bg-brand-canvas">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar extra={sidebarExtra} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-brand-canvas">
          {children}
        </main>
      </div>
    </div>
  )
}
