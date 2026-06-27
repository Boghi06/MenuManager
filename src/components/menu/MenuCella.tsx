import { PiattoSlot } from './PiattoSlot'

export interface Alternativa {
  voceId: number
  piattoId: number
  nome: string
}

interface MenuCellaProps {
  alternative: Alternativa[]
  tipo: string
  /** Numero massimo di alternative per questa sezione (default 3). */
  maxAlternative?: number
  onAdd: () => void
  onRemove: (voceId: number) => void
}

/** Contenuto di una cella di sezione principale (ant/pr/des). */
export function MenuCella({ alternative, tipo, maxAlternative = 3, onAdd, onRemove }: MenuCellaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {alternative.map(a => (
        <PiattoSlot
          key={a.voceId}
          nome={a.nome}
          piattoId={a.piattoId}
          tipo={tipo}
          onRemove={() => onRemove(a.voceId)}
        />
      ))}
      {alternative.length < maxAlternative && (
        <PiattoSlot tipo={tipo} addLabel="Aggiungi" onClick={onAdd} />
      )}
    </div>
  )
}
