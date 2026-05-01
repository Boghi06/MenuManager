import { useNavigate } from 'react-router-dom'
import { ConciergeBell, FileText, CircleDot, LogOut } from 'lucide-react'
import { COLORS } from '@/constants'
import { CATEGORIE } from '@/constants/piatti'
import { supabase } from '@/lib/supabase'

interface AppSidebarProps {
  activeCategory: string
  onCategoryChange: (cat: string) => void
}

export function AppSidebar({ activeCategory, onCategoryChange }: AppSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside
      className="w-50 flex flex-col border-r border-gray-300 gap-8 p-8"
      style={{ backgroundColor: COLORS.secondary }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold uppercase font-geist">Opzioni</h3>
        <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
          <ConciergeBell className="w-6 h-6 mr-2" />
          Elenco Piatti
        </button>
        <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
          <FileText className="w-6 h-6 mr-2" />
          Menú
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold uppercase font-geist">Categorie</h3>
        {CATEGORIE.map(({ label, value }) => (
          <button
            key={value}
            className="w-full flex items-center text-sm rounded"
            style={{ color: COLORS.text }}
            onClick={() => onCategoryChange(value)}
          >
            <CircleDot
              className="w-4 h-4 mr-2"
              style={{ color: activeCategory === value ? COLORS.accent : 'currentColor' }}
            />
            {label}
          </button>
        ))}
      </div>

      <button
        className="mt-auto w-full flex items-center text-sm rounded px-3 py-2 border transition-colors hover:bg-red-50"
        style={{ color: COLORS.accent, borderColor: COLORS.accent }}
        onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </button>
    </aside>
  )
}
