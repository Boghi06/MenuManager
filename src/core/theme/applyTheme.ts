import type { ClientConfig } from '@/config/types'

/**
 * Applica il branding del cliente prima del render:
 * inietta le CSS custom properties del brand su :root,
 * imposta document.title e la favicon.
 */
export function applyTheme(config: ClientConfig) {
  const root = document.documentElement
  const { brand } = config.theme

  root.style.setProperty('--brand-canvas', brand.primary)
  root.style.setProperty('--brand-surface', brand.secondary)
  root.style.setProperty('--brand', brand.accent)
  root.style.setProperty('--brand-dark', brand.accentDark)
  root.style.setProperty('--brand-ink', brand.text)

  document.title = config.appName

  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icon) icon.href = config.favicon
}
