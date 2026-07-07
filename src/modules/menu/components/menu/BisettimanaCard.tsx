import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { StatoBisettimana } from '@/modules/menu/hooks/useBisettimane'
import { getBisettimanaRange, formatBisettimanaRange } from '@/modules/menu/lib/bisettimane'

interface BisettimanaCardProps {
  anno: number
  mese: number
  idx: 1 | 2
  stato: StatoBisettimana
  className?: string
}

const STATO_BG: Record<StatoBisettimana, string> = {
  full:    '#000000',
  partial: '#A3A3A3',
  empty:   '#FFFFFF',
}

export function BisettimanaCard({ anno, mese, idx, stato, className }: BisettimanaCardProps) {
  const navigate = useNavigate()
  const range = getBisettimanaRange(anno, mese, idx)
  const rangeLabel = formatBisettimanaRange(range)

  return (
    <button
      onClick={() => navigate(`/menu/${anno}/${mese}/${idx}`)}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-[#E5E5E5] hover:border-black hover:bg-gray-50 transition-colors ${className ?? ''}`}
    >
      <div
        className="w-6 h-6 shrink-0"
        style={{
          background: STATO_BG[stato],
          border: stato === 'empty' ? '1px solid #D4D4D4' : 'none',
        }}
      />
      <div className="flex-1 text-left">
        <div className="text-[13px] font-medium text-black">Bisett. {idx === 1 ? 'A' : 'B'}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{rangeLabel}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
    </button>
  )
}
