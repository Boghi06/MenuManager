import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { supabase } from '@/core/lib/supabase'
import { useRole } from '@/core/auth/roles'
import { clientConfig } from '@/config/clients'
import { getEnabledModules } from '@/modules/registry'

interface AppSidebarProps {
  /** Contenuto extra sotto la navigazione (es. filtro categorie del modulo menu) */
  extra?: ReactNode
}

const allNavItems = getEnabledModules(clientConfig.enabledModules).flatMap((mod) => mod.navItems)

export function AppSidebar({ extra }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useRole()

  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(role))

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside
      className="w-72 flex flex-col border-r border-gray-300 gap-8 p-8 bg-brand-surface"
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold uppercase font-geist px-2 py-1">Opzioni</h3>
        {navItems.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn("w-full flex items-center text-base rounded px-3 py-1 transition-colors text-brand-ink", isActive(path) ? "bg-black/10 font-semibold" : "hover:bg-black/10")}
          >
            <Icon className="w-6 h-6 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {extra}

      <button
        className="mt-auto w-full flex items-center text-base rounded px-3 py-2 border transition-colors hover:bg-red-50 text-brand border-brand"
        onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </button>
    </aside>
  )
}
