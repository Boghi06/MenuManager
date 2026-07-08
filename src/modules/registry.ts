import type { RouteObject } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { ModuleId } from '@/config/types'
import { menuModule } from '@/modules/menu'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  /** Predisposto per la futura gestione ruoli: se assente, visibile a tutti */
  requiredRole?: string
}

export interface ModuleDefinition {
  id: ModuleId
  label: string
  /** Route di atterraggio del modulo (target del redirect da "/") */
  defaultPath: string
  routes: RouteObject[]
  navItems: NavItem[]
}

const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition | null> = {
  menu: menuModule,
  spa: null, // futuro modulo trattamenti spa
}

export function getEnabledModules(ids: ModuleId[]): ModuleDefinition[] {
  return ids
    .map((id) => {
      const mod = MODULE_REGISTRY[id]
      if (!mod) console.warn(`[modules] Modulo "${id}" abilitato in config ma non ancora implementato`)
      return mod
    })
    .filter((mod): mod is ModuleDefinition => mod !== null)
}
