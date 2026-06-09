import { TIPO_BAR, TIPO_LABEL, SEZIONI_ORDER } from '@/constants/piatti'
import { MenuCella, type Alternativa } from './MenuCella'
import { SecondoBlock } from './SecondoBlock'
import { PiattoSlot } from './PiattoSlot'
import type { MenuVoce, Servizio, SezioneTipo } from '@/types/menuVoce'

const MAX_ALTERNATIVE = 3

interface MenuComposerGridProps {
  voci: MenuVoce[]
  /** Settimana attiva: 0 = giorni 0–6, 1 = giorni 7–13. */
  settimana: 0 | 1
  servizio: Servizio
  /** Etichette dei 7 giorni della settimana attiva (es. "Lun 14"). */
  giorniLabels: string[]
  /** Risolve il nome di un piatto dal suo id. */
  nomePiatto: (id: number | null) => string
  onAdd: (giorno: number, tipo: SezioneTipo) => void
  onRemove: (voceId: number) => void
  onAddContorno: (secondoVoceId: number) => void
  onRemoveContorno: (secondoVoceId: number) => void
}

export function MenuComposerGrid({
  voci, settimana, servizio, giorniLabels, nomePiatto,
  onAdd, onRemove, onAddContorno, onRemoveContorno,
}: MenuComposerGridProps) {
  // colonna c (0–6) → giorno reale
  const giornoDi = (c: number) => settimana * 7 + c

  // voci della cella (giorno, servizio, tipo) ordinate per posizione
  const vociCella = (giorno: number, tipo: SezioneTipo) =>
    voci
      .filter(v => v.giorno === giorno && v.servizio === servizio && v.tipo === tipo)
      .sort((a, b) => a.posizione - b.posizione)

  const toAlternative = (vs: MenuVoce[]): Alternativa[] =>
    vs.map(v => ({ voceId: v.id, piattoId: v.piatto_id, nome: nomePiatto(v.piatto_id) }))

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th className="w-[84px] py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 border-b border-[#D4D4D4]">
            Sezione
          </th>
          {giorniLabels.map((g, c) => (
            <th
              key={c}
              className="py-3 px-2 text-left align-bottom border-b border-[#D4D4D4] border-r border-r-[#E5E5E5]
                         first:border-l first:border-l-[#E5E5E5]"
            >
              <div className="font-sans text-sm font-semibold text-black leading-none">{g}</div>
              <div className="text-[10px] uppercase tracking-[0.05em] text-gray-500 mt-1.5">{servizio}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SEZIONI_ORDER.map(tipo => (
          <tr key={tipo}>
            <td className="py-2.5 pr-2 align-top border-b border-[#E5E5E5]">
              <div className="flex items-center gap-1.5">
                <div className="shrink-0 rounded-sm" style={{ width: 3, height: 18, background: TIPO_BAR[tipo] }} />
                <span className="font-fraunces text-sm italic text-black leading-tight">{TIPO_LABEL[tipo]}</span>
              </div>
            </td>
            {giorniLabels.map((_, c) => {
              const giorno = giornoDi(c)
              const vs = vociCella(giorno, tipo)
              return (
                <td
                  key={c}
                  className="p-1.5 align-top border-b border-[#E5E5E5] border-r border-r-[#E5E5E5]
                             first:border-l first:border-l-[#E5E5E5]"
                >
                  {tipo === 'se' ? (
                    <div className="flex flex-col gap-1.5">
                      {vs.map(v => (
                        <SecondoBlock
                          key={v.id}
                          nome={nomePiatto(v.piatto_id)}
                          piattoId={v.piatto_id}
                          contornoNome={v.contorno_id != null ? nomePiatto(v.contorno_id) : null}
                          onRemove={() => onRemove(v.id)}
                          onAddContorno={() => onAddContorno(v.id)}
                          onRemoveContorno={() => onRemoveContorno(v.id)}
                        />
                      ))}
                      {vs.length < MAX_ALTERNATIVE && (
                        <PiattoSlot tipo="se" addLabel="Aggiungi secondo" onClick={() => onAdd(giorno, 'se')} />
                      )}
                    </div>
                  ) : (
                    <MenuCella
                      alternative={toAlternative(vs)}
                      tipo={tipo}
                      onAdd={() => onAdd(giorno, tipo)}
                      onRemove={onRemove}
                    />
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
