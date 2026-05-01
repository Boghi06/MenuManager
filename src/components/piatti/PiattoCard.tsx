import { memo } from 'react'
import { MoreVertical, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { COLORS } from '@/constants'
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
      className="relative border-b border-gray-200 py-6 group hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onOpenRicetta(piatto)}
    >
      <div className="flex px-8">
        <div className="flex flex-1">
          <div className="w-1 mr-4 shrink-0 rounded-full" style={{ backgroundColor: COLORS.text }} />
          <div className="flex-1 pr-12">
            <h2 className="text-xl font-serif mb-1" style={{ color: COLORS.text }}>{piatto.nome_it}</h2>
            <p className="text-sm text-gray-500 mb-2 font-sans">{piatto.id} - {TIPO_LABEL[piatto.tipo ?? ''] ?? '—'}</p>
            <PiattoBadges piatto={piatto} />
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
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
