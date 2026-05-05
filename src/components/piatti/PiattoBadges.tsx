import { CARATTERISTICHE, ALLERGENI } from '@/constants/piatti'
import type { Piatto } from '@/types/piatto'

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
          {attiveCaratteristiche.map(({ field, label, Icon, badgeClass }) => (
            <span key={field} className={`inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full ${badgeClass}`}>
              <Icon className="w-3 h-3" />{label}
            </span>
          ))}
        </div>
      )}
      {attiveAllergeni.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {attiveAllergeni.map(({ field, label, Icon }) => (
            <span key={field} className="inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
              <Icon className="w-3 h-3" />{label}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
