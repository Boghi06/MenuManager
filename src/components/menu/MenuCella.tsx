import { PiattoSlot } from './PiattoSlot'

export interface Alternativa {
  voceId: number
  piattoId: number
  nome: string
}

interface MenuCellaProps {
  alternative: Alternativa[]
  tipo: string
  onAdd: () => void
  onRemove: (voceId: number) => void
}

const MAX_ALTERNATIVE = 3

/** Contenuto di una cella di sezione principale (ant/pr/des): fino a 3 alternative + "Aggiungi". */
export function MenuCella({ alternative, tipo, onAdd, onRemove }: MenuCellaProps) {
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
      {alternative.length < MAX_ALTERNATIVE && (
        <PiattoSlot tipo={tipo} addLabel="Aggiungi" onClick={onAdd} />
      )}
    </div>
  )
}
