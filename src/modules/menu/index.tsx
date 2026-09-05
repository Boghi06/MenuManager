import { lazy } from 'react'
import { ConciergeBell, FileText, CalendarHeart, Settings, ScrollText, Users } from 'lucide-react'
import type { ModuleDefinition } from '@/modules/registry'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const MenuPlanner = lazy(() => import('./pages/MenuPlanner'))
const MenuComposer = lazy(() => import('./pages/MenuComposer'))
const GestioneEventi = lazy(() => import('./pages/GestioneEventi'))
const Impostazioni = lazy(() => import('./pages/Impostazioni'))
const Auditing = lazy(() => import('./pages/Auditing'))
const GestioneUtenti = lazy(() => import('./pages/GestioneUtenti'))

export const menuModule: ModuleDefinition = {
  id: 'menu',
  label: 'Menù',
  defaultPath: '/piatti',
  // Il receptionist consulta piatti e menù (sola lettura, gestita nelle
  // pagine) e li stampa; eventi e footer seguono la cucina, che compone il
  // menù; l'audit è solo admin.
  routes: [
    { path: '/piatti', element: <Dashboard /> },
    { path: '/menu', element: <MenuPlanner /> },
    { path: '/menu/:anno/:mese/:bisett', element: <MenuComposer /> },
    { path: '/eventi', element: <GestioneEventi />, roles: ['cucina', 'admin'] },
    { path: '/impostazioni', element: <Impostazioni />, roles: ['cucina', 'admin'] },
    { path: '/auditing', element: <Auditing />, roles: ['admin'] },
    { path: '/utenti', element: <GestioneUtenti />, roles: ['admin'] },
  ],
  navItems: [
    { label: 'Elenco piatti', path: '/piatti', icon: ConciergeBell },
    { label: 'Pianificazione menù', path: '/menu', icon: FileText },
    { label: 'Gestione eventi', path: '/eventi', icon: CalendarHeart, roles: ['cucina', 'admin'] },
    { label: 'Note piè di pagina', path: '/impostazioni', icon: Settings, roles: ['cucina', 'admin'] },
    { label: 'Registro attività', path: '/auditing', icon: ScrollText, roles: ['admin'] },
    { label: 'Gestione utenti', path: '/utenti', icon: Users, roles: ['admin'] },
  ],
}
