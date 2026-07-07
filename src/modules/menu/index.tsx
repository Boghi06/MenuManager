import { lazy } from 'react'
import { ConciergeBell, FileText, CalendarHeart, Settings } from 'lucide-react'
import type { ModuleDefinition } from '@/modules/registry'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const MenuPlanner = lazy(() => import('./pages/MenuPlanner'))
const MenuComposer = lazy(() => import('./pages/MenuComposer'))
const GestioneEventi = lazy(() => import('./pages/GestioneEventi'))
const Impostazioni = lazy(() => import('./pages/Impostazioni'))

export const menuModule: ModuleDefinition = {
  id: 'menu',
  label: 'Menù',
  defaultPath: '/piatti',
  routes: [
    { path: '/piatti', element: <Dashboard /> },
    { path: '/menu', element: <MenuPlanner /> },
    { path: '/menu/:anno/:mese/:bisett', element: <MenuComposer /> },
    { path: '/eventi', element: <GestioneEventi /> },
    { path: '/impostazioni', element: <Impostazioni /> },
  ],
  navItems: [
    { label: 'Elenco piatti', path: '/piatti', icon: ConciergeBell },
    { label: 'Pianificazione menù', path: '/menu', icon: FileText },
    { label: 'Gestione eventi', path: '/eventi', icon: CalendarHeart },
    { label: 'Footer menù', path: '/impostazioni', icon: Settings },
  ],
}
