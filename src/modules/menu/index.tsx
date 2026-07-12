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
  // La cucina consulta piatti e menù (sola lettura, gestita nelle pagine);
  // eventi e footer restano a receptionist e admin; l'audit è solo admin.
  routes: [
    { path: '/piatti', element: <Dashboard /> },
    { path: '/menu', element: <MenuPlanner /> },
    { path: '/menu/:anno/:mese/:bisett', element: <MenuComposer /> },
    { path: '/eventi', element: <GestioneEventi />, roles: ['receptionist', 'admin'] },
    { path: '/impostazioni', element: <Impostazioni />, roles: ['receptionist', 'admin'] },
    { path: '/auditing', element: <Auditing />, roles: ['admin'] },
    { path: '/utenti', element: <GestioneUtenti />, roles: ['admin'] },
  ],
  navItems: [
    { label: 'Elenco piatti', path: '/piatti', icon: ConciergeBell },
    { label: 'Pianificazione menù', path: '/menu', icon: FileText },
    { label: 'Gestione eventi', path: '/eventi', icon: CalendarHeart, roles: ['receptionist', 'admin'] },
    { label: 'Footer menù', path: '/impostazioni', icon: Settings, roles: ['receptionist', 'admin'] },
    { label: 'Registro attività', path: '/auditing', icon: ScrollText, roles: ['admin'] },
    { label: 'Gestione utenti', path: '/utenti', icon: Users, roles: ['admin'] },
  ],
}
