import { useNavigate, useLocation } from 'react-router-dom'
import { ConciergeBell, FileText, CircleDot, LogOut, Settings, CalendarHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COLORS } from '@/constants'
import { CATEGORIE } from '@/constants/piatti'
import { supabase } from '@/lib/supabase'

interface AppSidebarProps {
  showCategorie?: boolean
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
  counts?: Record<string, number>
}

export function AppSidebar({ showCategorie = true, activeCategory, onCategoryChange, counts }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPiattiActive = location.pathname === '/' || location.pathname.startsWith('/piatti')
  const isMenuActive = location.pathname.startsWith('/menu')
  const isEventiActive = location.pathname === '/eventi'
  const isImpostazioniActive = location.pathname === '/impostazioni'

  return (
    <aside
      className="w-72 flex flex-col border-r border-gray-300 gap-8 p-8"
      style={{ backgroundColor: COLORS.secondary }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold uppercase font-geist px-2 py-1">Opzioni</h3>
        <button
          onClick={() => navigate('/')}
          className={cn("w-full flex items-center text-base rounded px-3 py-1 transition-colors", isPiattiActive ? "bg-black/10 font-semibold" : "hover:bg-black/10")}
          style={{ color: COLORS.text }}
        >
          <ConciergeBell className="w-6 h-6 mr-2" />
          Elenco piatti
        </button>
        <button
          onClick={() => navigate('/menu')}
          className={cn("w-full flex items-center text-base rounded px-3 py-1 transition-colors", isMenuActive ? "bg-black/10 font-semibold" : "hover:bg-black/10")}
          style={{ color: COLORS.text }}
        >
          <FileText className="w-6 h-6 mr-2" />
          Pianificazione menù
        </button>
        <button
          onClick={() => navigate('/eventi')}
          className={cn("w-full flex items-center text-base rounded px-3 py-1 transition-colors", isEventiActive ? "bg-black/10 font-semibold" : "hover:bg-black/10")}
          style={{ color: COLORS.text }}
        >
          <CalendarHeart className="w-6 h-6 mr-2" />
          Gestione eventi
        </button>
        <button
          onClick={() => navigate('/impostazioni')}
          className={cn("w-full flex items-center text-base rounded px-3 py-1 transition-colors", isImpostazioniActive ? "bg-black/10 font-semibold" : "hover:bg-black/10")}
          style={{ color: COLORS.text }}
        >
          <Settings className="w-6 h-6 mr-2" />
          Footer menù
        </button>
      </div>

      {showCategorie && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold uppercase font-geist px-2 py-1">Categorie</h3>
          {CATEGORIE.map(({ label, value }) => (
            <button
              key={value}
              className="w-full flex items-center text-base rounded px-3 py-1 transition-colors hover:bg-black/10"
              style={{ color: COLORS.text }}
              onClick={() => onCategoryChange?.(value)}
            >
              <CircleDot
                className="w-5 h-5 mr-2"
                style={{ color: activeCategory === value ? COLORS.accent : 'currentColor' }}
              />
              <span className="flex-1 text-left">{label}</span>
              {counts && (
                <span className="text-sm text-gray-500 tabular-nums">
                  {(counts[value] ?? 0).toLocaleString('it-IT')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        className="mt-auto w-full flex items-center text-base rounded px-3 py-2 border transition-colors hover:bg-red-50"
        style={{ color: COLORS.accent, borderColor: COLORS.accent }}
        onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </button>
    </aside>
  )
}
