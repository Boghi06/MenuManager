import type { ClientConfig } from '@/config/types'

export const hotelGarden: ClientConfig = {
  id: 'hotel-garden',
  appName: 'Hotel Garden Terme',
  logo: '/clients/hotel-garden/logo.svg',
  favicon: '/clients/hotel-garden/favicon.svg',
  theme: {
    brand: {
      primary: '#FFFFFF',
      secondary: '#D9D9D9',
      accent: '#B23A1F',
      accentDark: '#75160D',
      text: '#000000',
    },
  },
  enabledModules: ['menu'],
}
