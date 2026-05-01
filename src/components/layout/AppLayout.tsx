import type { ReactNode } from 'react'
import { COLORS } from '@/constants'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  activeCategory: string
  onCategoryChange: (cat: string) => void
  children: ReactNode
}

export function AppLayout({ activeCategory, onCategoryChange, children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
          {children}
        </main>
      </div>
    </div>
  )
}
