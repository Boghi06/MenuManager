export type ModuleId = 'menu' | 'spa'

export interface BrandTheme {
  /** Sfondo principale (era COLORS.primary) */
  primary: string
  /** Superfici secondarie: header, sidebar (era COLORS.secondary) */
  secondary: string
  /** Colore accento del brand (era COLORS.accent) */
  accent: string
  /** Variante scura dell'accento (era COLORS.accentDark) */
  accentDark: string
  /** Colore testo/elementi neri (era COLORS.text) */
  text: string
}

export interface ClientConfig {
  id: string
  /** Nome mostrato in title, alt del logo, stampe */
  appName: string
  /** Path del logo dentro public/ */
  logo: string
  /** Path della favicon dentro public/ */
  favicon: string
  theme: {
    brand: BrandTheme
  }
  enabledModules: ModuleId[]
  modules?: {
    menu?: {
      /** Override della palette di stampa per tipo piatto */
      tipoBar?: Record<string, string>
    }
    spa?: Record<string, never>
  }
}
