import type { ClientConfig } from '@/config/types'
import { hotelGarden } from './hotel-garden'

const CLIENTS: Record<string, ClientConfig> = {
  'hotel-garden': hotelGarden,
}

function resolveClient(): ClientConfig {
  const id = import.meta.env.VITE_CLIENT as string | undefined
  if (!id) {
    console.warn('[config] VITE_CLIENT non impostato: uso il default "hotel-garden"')
    return hotelGarden
  }
  const config = CLIENTS[id]
  if (!config) {
    throw new Error(`[config] Cliente sconosciuto: "${id}". Registralo in src/config/clients/index.ts`)
  }
  return config
}

export const clientConfig = resolveClient()
