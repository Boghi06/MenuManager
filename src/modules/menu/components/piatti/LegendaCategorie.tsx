import { CATEGORIE_PIATTO, CATEGORIA_BAR, CATEGORIA_LABEL } from '@/modules/menu/constants/piatti'

/**
 * Leggenda dei colori della barra verticale del piatto (carne/pesce/
 * vegetariano). Sta accanto agli elenchi di piatti — elenco piatti e
 * composizione menù — perché il codice colore non è autoesplicativo.
 */
export function LegendaCategorie({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {CATEGORIE_PIATTO.map(cat => (
        <span key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="rounded-sm"
            style={{ width: 3, height: 14, background: CATEGORIA_BAR[cat] }}
          />
          {CATEGORIA_LABEL[cat]}
        </span>
      ))}
    </div>
  )
}
