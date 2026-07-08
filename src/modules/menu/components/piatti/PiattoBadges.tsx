import { CARATTERISTICHE, ALLERGENI } from '@/modules/menu/constants/piatti'
import type { Piatto } from '@/modules/menu/types/piatto'

export function AllergenNum({ n, size = 22 }: { n: number; size?: number }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      className="inline-flex items-center justify-center rounded-full bg-white text-black border-[1.5px] border-black font-geist font-semibold tabular-nums shrink-0"
    >
      {n}
    </span>
  )
}

interface PiattoBadgesProps {
  piatto: Piatto
}

export function PiattoBadges({ piatto }: PiattoBadgesProps) {
  const attiveCaratteristiche = CARATTERISTICHE.filter(c => piatto[c.field as keyof Piatto])
  const attiveAllergeni = ALLERGENI.filter(a => piatto[a.field as keyof Piatto])

  return (
    <>
      {attiveCaratteristiche.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {attiveCaratteristiche.map(({ field, label, isAccent }) => (
            <span
              key={field}
              className={
                isAccent
                  ? 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-sm font-medium'
                  : 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-black text-black text-sm font-medium bg-white'
              }
              style={isAccent ? { borderColor: 'var(--brand)', color: 'var(--brand)', background: 'color-mix(in srgb, var(--brand) 9%, white)' } : undefined}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      {attiveAllergeni.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {attiveAllergeni.map(({ field, number }) => (
            <AllergenNum key={field} n={number} size={22} />
          ))}
        </div>
      )}
    </>
  )
}
