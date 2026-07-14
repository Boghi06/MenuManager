import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  /** Etichetta piccola sopra il titolo (resa in maiuscolo), es. la sezione */
  eyebrow?: ReactNode
  /** Titolo principale della pagina */
  title: ReactNode
  /** Sottotitolo descrittivo opzionale */
  subtitle?: ReactNode
  /** Azioni allineate a destra del titolo (bottoni, toggle, filtri…) */
  actions?: ReactNode
  /** Link "indietro" opzionale, mostrato sopra l'eyebrow */
  back?: { label: string; onClick: () => void }
  /** Contenuto extra a tutta larghezza sotto il titolo (es. barra di ricerca) */
  children?: ReactNode
}

/**
 * Header di pagina condiviso: uniforma titolo, eyebrow, sottotitolo, azioni e
 * spaziatura in tutte le pagine. Vincoli di design fissati qui (una sola volta):
 * titolo Fraunces 44px senza underline, eyebrow 11px maiuscolo, padding px-8.
 * Non aggiungere override di dimensione/underline nelle singole pagine.
 */
export function PageHeader({ eyebrow, title, subtitle, actions, back, children }: PageHeaderProps) {
  return (
    <div className="px-8 pt-8 pb-6 border-b border-gray-200 shrink-0">
      {back && (
        <button
          onClick={back.onClick}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 mb-3 transition-colors hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          {back.label}
        </button>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="font-fraunces font-light text-[44px] leading-none">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-3">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
