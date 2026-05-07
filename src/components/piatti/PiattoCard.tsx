import { memo } from 'react'
import { MoreVertical, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { COLORS, TIPO_BAR } from '@/constants'
import { TIPO_LABEL } from '@/constants/piatti'
import { PiattoBadges } from './PiattoBadges'
import type { Piatto } from '@/types/piatto'

interface PiattoCardProps {
  piatto: Piatto
  onOpenRicetta: (p: Piatto) => void
  onOpenModifica: (p: Piatto) => void
  onOpenElimina: (id: number) => void
}

export const PiattoCard = memo(function PiattoCard({
  piatto, onOpenRicetta, onOpenModifica, onOpenElimina,
}: PiattoCardProps) {
  return (
    <div
      className="grid grid-cols-[4px_1fr_320px_32px] gap-5 px-8 py-6 border-b border-gray-200 group hover:bg-gray-50 transition-colors cursor-pointer items-start"
      onClick={() => onOpenRicetta(piatto)}
    >
      <div
        className="self-stretch rounded-full"
        style={{ backgroundColor: TIPO_BAR[piatto.tipo ?? ''] ?? COLORS.text }}
      />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-serif" style={{ color: COLORS.text }}>{piatto.nome_it}</h2>
          {!piatto.ricetta && (
            <span
              className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm shrink-0"
              style={{ color: COLORS.accent, border: `1px solid ${COLORS.accent}` }}
            >
              Ricetta mancante
            </span>
          )}
        </div>
        <p className="text-base text-gray-500 font-sans">{piatto.id} - {TIPO_LABEL[piatto.tipo ?? ''] ?? '—'}</p>
      </div>

      <div>
        <PiattoBadges piatto={piatto} />
      </div>

      <div onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-200 rounded-md outline-none focus:outline-none opacity-0 group-hover:opacity-100 data-popup-open:opacity-100 data-open:opacity-100 transition-opacity">
            <MoreVertical className="w-5 h-5" style={{ color: COLORS.text }} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 font-sans">
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenRicetta(piatto)}>
                <ExternalLink className="mr-2 h-4 w-4" /><span>Vedi ricetta</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenModifica(piatto)}>
                <Pencil className="mr-2 h-4 w-4" /><span>Modifica</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)]"
                style={{ color: COLORS.accent, '--accent-color': COLORS.accent } as React.CSSProperties}
                onClick={() => onOpenElimina(piatto.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" style={{ color: COLORS.accent }} /><span>Elimina</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})
