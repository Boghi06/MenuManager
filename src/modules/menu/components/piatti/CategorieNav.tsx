import { CircleDot } from 'lucide-react'
import { CATEGORIE } from '@/modules/menu/constants/piatti'

interface CategorieNavProps {
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
  counts?: Record<string, number>
}

export function CategorieNav({ activeCategory, onCategoryChange, counts }: CategorieNavProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold uppercase font-geist px-2 py-1">Categorie</h3>
      {CATEGORIE.map(({ label, value }) => (
        <button
          key={value}
          className="w-full flex items-center text-base rounded px-3 py-1 transition-colors hover:bg-black/10 text-brand-ink"
          onClick={() => onCategoryChange?.(value)}
        >
          <CircleDot
            className="w-5 h-5 mr-2"
            style={{ color: activeCategory === value ? 'var(--brand)' : 'currentColor' }}
          />
          <span className="flex-1 text-left">{label}</span>
          {counts && (
            <span className="text-sm text-gray-500 tabular-nums">
              {(counts[value] ?? 0).toLocaleString('it-IT')}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
