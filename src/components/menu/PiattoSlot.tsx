import { Plus, X } from 'lucide-react'
import { TIPO_BAR } from '@/constants/piatti'

interface PiattoSlotProps {
  /** Piatto da mostrare. Se assente, lo slot è un bottone "+ Aggiungi". */
  nome?: string
  /** ID piatto, mostrato in piccolo sotto il nome. */
  piattoId?: number
  /** Codice tipo per la barra colore (ant|pr|se|con|des). */
  tipo: string
  /** Testo dello slot vuoto (default "Aggiungi piatto"). */
  addLabel?: string
  /** Variante ridotta usata per i contorni. */
  compact?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export function PiattoSlot({
  nome, piattoId, tipo, addLabel = 'Aggiungi piatto', compact = false, onClick, onRemove,
}: PiattoSlotProps) {
  // Slot vuoto → bottone tratteggiato
  if (!nome) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2 border border-dashed border-[#D4D4D4] bg-transparent
                    text-gray-500 rounded transition-colors hover:border-gray-400 hover:text-black
                    ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
      >
        <Plus className={compact ? 'w-3.5 h-3.5 text-gray-400' : 'w-4 h-4 text-gray-400'} />
        <span>{addLabel}</span>
      </button>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`group/slot w-full flex items-start gap-1.5 border border-[#D4D4D4] bg-white rounded
                  ${onClick ? 'cursor-pointer' : ''} ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}
    >
      <div
        className="shrink-0 self-stretch rounded-sm"
        style={{ width: 3, background: TIPO_BAR[tipo] ?? '#000000' }}
      />
      <div className="flex-1 min-w-0">
        {compact && (
          <div className="text-[9px] uppercase tracking-[0.05em] text-gray-500 leading-none">contorno</div>
        )}
        <div
          className={`font-fraunces text-black leading-tight break-words ${compact ? 'text-[13px]' : 'text-sm'}`}
        >
          {nome}
        </div>
        {!compact && piattoId != null && (
          <div className="text-[10px] text-gray-400 font-sans leading-tight">#{piattoId}</div>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          title="Rimuovi"
          className="shrink-0 p-0.5 text-gray-400 opacity-0 group-hover/slot:opacity-60 hover:!opacity-100 hover:text-black transition-opacity"
        >
          <X className={compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </div>
  )
}
