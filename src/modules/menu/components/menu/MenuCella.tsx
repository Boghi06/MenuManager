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
  /** Sola visualizzazione: niente slot "Aggiungi" né rimozione. */
  readOnly?: boolean
  onAdd: () => void
  onRemove: (voceId: number) => void
}

/** Contenuto di una cella di sezione principale (ant/pr/des). */
export function MenuCella({ alternative, tipo, maxAlternative = 3, readOnly = false, onAdd, onRemove }: MenuCellaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {alternative.map(a => (
        <PiattoSlot
          key={a.voceId}
          nome={a.nome}
          piattoId={a.piattoId}
          tipo={tipo}
          onRemove={readOnly ? undefined : () => onRemove(a.voceId)}
        />
      ))}
      {!readOnly && alternative.length < maxAlternative && (
        <PiattoSlot tipo={tipo} addLabel="Aggiungi" onClick={onAdd} />
      )}
    </div>
  )
}
