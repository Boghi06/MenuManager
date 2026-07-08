import { useMemo } from 'react'
import { Plus, X } from 'lucide-react'
import { TIPO_BAR, TIPO_LABEL, SEZIONI_ORDER, SEZIONI_MAX } from '@/modules/menu/constants/piatti'
import { MenuCella, type Alternativa } from './MenuCella'
import { SecondoBlock } from './SecondoBlock'
import { PiattoSlot } from './PiattoSlot'
import type { FlagKey, MenuVoce, Servizio, SezioneTipo } from '@/modules/menu/types/menuVoce'
import type { Evento } from '@/modules/menu/types/evento'

interface MenuComposerGridProps {
  voci: MenuVoce[]
  settimana: 0 | 1
  servizio: Servizio
  giorniLabels: string[]
  nomePiatto: (id: number | null) => string
  onAdd: (giorno: number, tipo: SezioneTipo) => void
  onRemove: (voceId: number) => void
  onAddContorno: (secondoVoceId: number) => void
  onRemoveContorno: (secondoVoceId: number) => void
  getFlag: (giorno: number, key: FlagKey) => boolean
  onToggleFlag: (giorno: number, key: FlagKey) => void
  getEventoId: (giorno: number) => string | null
  onSetEventoId: (giorno: number, id: string | null) => void
  eventi: Evento[]
}

// ─── Helper: riga toggle ─────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string
  barColor: string
  chipText: string
  flagKey: FlagKey
  giorni: number[]
  getFlag: (giorno: number, key: FlagKey) => boolean
  onToggleFlag: (giorno: number, key: FlagKey) => void
}

function ToggleRow({ label, barColor, chipText, flagKey, giorni, getFlag, onToggleFlag }: ToggleRowProps) {
  const tdCell = 'p-1.5 align-top border-b border-[#E5E5E5] border-r border-r-[#E5E5E5] first:border-l first:border-l-[#E5E5E5]'

  return (
    <tr>
      <td className="py-2.5 pr-2 align-top border-b border-[#E5E5E5]">
        <div className="flex items-center gap-1.5">
          <div className="shrink-0 rounded-sm" style={{ width: 3, height: 18, background: barColor }} />
          <span className="font-fraunces text-sm italic text-gray-500 leading-tight">{label}</span>
        </div>
      </td>
      {giorni.map(giorno => {
        const shown = getFlag(giorno, flagKey)
        return (
          <td key={giorno} className={tdCell}>
            {shown ? (
              <div className="group/slot w-full flex items-center gap-1.5 border border-[#D4D4D4] bg-white rounded px-2 py-1.5">
                <div className="shrink-0 rounded-sm" style={{ width: 3, height: 16, background: barColor }} />
                <span className="font-fraunces text-sm text-gray-600 flex-1 leading-tight truncate">{chipText}</span>
                <button
                  type="button"
                  title="Nascondi"
                  onClick={() => onToggleFlag(giorno, flagKey)}
                  className="shrink-0 p-0.5 text-gray-400 opacity-0 group-hover/slot:opacity-60 hover:!opacity-100 hover:text-black transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                title="Mostra"
                onClick={() => onToggleFlag(giorno, flagKey)}
                className="w-full flex items-center gap-2 border border-dashed border-[#D4D4D4] bg-transparent text-gray-400 rounded px-3 py-2 text-sm transition-colors hover:border-gray-400 hover:text-gray-600"
              >
                <Plus className="w-4 h-4" />
                <span>{label}</span>
              </button>
            )}
          </td>
        )
      })}
    </tr>
  )
}

// ─── Helper: cella evento (chip o select) ─────────────────────────────────────

function EventoCell({ eventoId, eventi, onSelect }: {
  eventoId: string | null
  eventi: Evento[]
  onSelect: (id: string | null) => void
}) {
  const evento = eventi.find(e => e.id === eventoId)

  if (eventoId && evento) {
    return (
      <div className="group/slot w-full flex items-center gap-1.5 border border-amber-200 bg-amber-50 rounded px-2 py-1.5">
        <span className="font-fraunces text-sm text-amber-800 flex-1 leading-tight truncate">{evento.nome}</span>
        <button
          type="button"
          title="Rimuovi evento"
          onClick={() => onSelect(null)}
          className="shrink-0 p-0.5 text-amber-400 opacity-0 group-hover/slot:opacity-60 hover:!opacity-100 hover:text-amber-800 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <select
      value=""
      onChange={e => { if (e.target.value) onSelect(e.target.value) }}
      className="w-full rounded border border-dashed border-[#D4D4D4] bg-transparent text-gray-400 text-xs px-2 py-1.5 cursor-pointer hover:border-gray-400 transition-colors"
    >
      <option value="" disabled>+ Seleziona evento</option>
      {eventi.length === 0 && <option disabled>Nessun evento creato</option>}
      {eventi.map(e => (
        <option key={e.id} value={e.id}>{e.nome}</option>
      ))}
    </select>
  )
}

// ─── Main grid ────────────────────────────────────────────────────────────────

export function MenuComposerGrid({
  voci, settimana, servizio, giorniLabels, nomePiatto,
  onAdd, onRemove, onAddContorno, onRemoveContorno,
  getFlag, onToggleFlag, getEventoId, onSetEventoId, eventi,
}: MenuComposerGridProps) {
  const giornoDi = (c: number) => settimana * 7 + c
  const giorni = giorniLabels.map((_, c) => giornoDi(c))

  // Un solo pass su voci per costruire la mappa "giorno:tipo" → voci ordinate.
  // Evita 28 chiamate filter() per render (7 giorni × 4 sezioni).
  const vociMap = useMemo(() => {
    const m = new Map<string, MenuVoce[]>()
    for (const v of voci) {
      if (v.servizio !== servizio) continue
      const k = `${v.giorno}:${v.tipo}`
      const arr = m.get(k)
      if (arr) arr.push(v)
      else m.set(k, [v])
    }
    for (const arr of m.values()) arr.sort((a, b) => a.posizione - b.posizione)
    return m
  }, [voci, servizio])

  const vociCella = (giorno: number, tipo: SezioneTipo): MenuVoce[] =>
    vociMap.get(`${giorno}:${tipo}`) ?? []

  const toAlternative = (vs: MenuVoce[]): Alternativa[] =>
    vs.map(v => ({ voceId: v.id, piattoId: v.piatto_id, nome: nomePiatto(v.piatto_id) }))

  const thCell = 'py-3 px-2 text-left align-bottom border-b border-[#D4D4D4] border-r border-r-[#E5E5E5] first:border-l first:border-l-[#E5E5E5]'
  const tdCell = 'p-1.5 align-top border-b border-[#E5E5E5] border-r border-r-[#E5E5E5] first:border-l first:border-l-[#E5E5E5]'

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          <th className="w-[84px] py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 border-b border-[#D4D4D4]">
            Sezione
          </th>
          {giorniLabels.map((g, c) => (
            <th key={c} className={thCell}>
              <div className="font-sans text-sm font-semibold text-black leading-none">{g}</div>
              <div className="text-[10px] uppercase tracking-[0.05em] text-gray-500 mt-1.5">{servizio}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>

        {/* ── Riga evento speciale ─────────────────────────────────── */}
        <tr>
          <td className="py-2.5 pr-2 align-top border-b border-[#E5E5E5]">
            <div className="flex items-center gap-1.5">
              <div className="shrink-0 rounded-sm" style={{ width: 3, height: 18, background: '#D97706' }} />
              <span className="font-fraunces text-sm italic text-gray-500 leading-tight">Evento</span>
            </div>
          </td>
          {giorni.map(giorno => (
            <td key={giorno} className={tdCell}>
              <EventoCell
                eventoId={getEventoId(giorno)}
                eventi={eventi}
                onSelect={(id) => onSetEventoId(giorno, id)}
              />
            </td>
          ))}
        </tr>

        {SEZIONI_ORDER.map(tipo => (
          <>
            <tr key={tipo}>
              <td className="py-2.5 pr-2 align-top border-b border-[#E5E5E5]">
                <div className="flex items-center gap-1.5">
                  <div className="shrink-0 rounded-sm" style={{ width: 3, height: 18, background: TIPO_BAR[tipo] }} />
                  <span className="font-fraunces text-sm italic text-black leading-tight">{TIPO_LABEL[tipo]}</span>
                </div>
              </td>
              {giorni.map(giorno => {
                const vs = vociCella(giorno, tipo)
                return (
                  <td key={giorno} className={tdCell}>
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
                        {vs.length < SEZIONI_MAX[tipo] && (
                          <PiattoSlot tipo="se" addLabel="Aggiungi secondo" onClick={() => onAdd(giorno, 'se')} />
                        )}
                      </div>
                    ) : (
                      <MenuCella
                        alternative={toAlternative(vs)}
                        tipo={tipo}
                        maxAlternative={SEZIONI_MAX[tipo]}
                        onAdd={() => onAdd(giorno, tipo)}
                        onRemove={onRemove}
                      />
                    )}
                  </td>
                )
              })}
            </tr>

            {tipo === 'pr' && (
              <ToggleRow
                key="succhi"
                label="Succhi"
                barColor="#A3A3A3"
                chipText="Succhi di frutta"
                flagKey="show_succhi"
                giorni={giorni}
                getFlag={getFlag}
                onToggleFlag={onToggleFlag}
              />
            )}

            {tipo === 'se' && (
              <>
                <ToggleRow
                  key="insalate"
                  label="Insalate"
                  barColor="#A3A3A3"
                  chipText="Insalate miste dal buffet"
                  flagKey="show_insalate"
                  giorni={giorni}
                  getFlag={getFlag}
                  onToggleFlag={onToggleFlag}
                />
                <ToggleRow
                  key="formaggi"
                  label="Formaggi"
                  barColor="#B0B0B0"
                  chipText="Scelta di formaggi tradizionali"
                  flagKey="show_formaggi"
                  giorni={giorni}
                  getFlag={getFlag}
                  onToggleFlag={onToggleFlag}
                />
              </>
            )}

            {tipo === 'des' && (
              <ToggleRow
                key="buffet-dessert"
                label="Buf. dessert"
                barColor="#9E9E9E"
                chipText="Buffet di dessert"
                flagKey="show_buffet_dessert"
                giorni={giorni}
                getFlag={getFlag}
                onToggleFlag={onToggleFlag}
              />
            )}
          </>
        ))}
      </tbody>
    </table>
  )
}
