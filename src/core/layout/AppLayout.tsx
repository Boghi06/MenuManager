import type { ReactNode } from 'react'
import { COLORS } from '@/constants'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  showCategorie?: boolean
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
  counts?: Record<string, number>
  children: ReactNode
}

export function AppLayout({ showCategorie = true, activeCategory, onCategoryChange, counts, children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          showCategorie={showCategorie}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          counts={counts}
        />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
          {children}
        </main>
      </div>
    </div>
  )
}
