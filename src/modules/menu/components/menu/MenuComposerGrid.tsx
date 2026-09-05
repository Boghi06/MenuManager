import { useMemo, Fragment } from 'react'
import { Plus, X } from 'lucide-react'
import { TIPO_BAR, TIPO_LABEL, SEZIONI_ORDER, SEZIONI_MAX, secondoHaContorno } from '@/modules/menu/constants/piatti'
import { SecondoBlock } from './SecondoBlock'
import { PiattoSlot } from './PiattoSlot'
import type { FlagKey, MenuVoce, Servizio, SezioneTipo } from '@/modules/menu/types/menuVoce'
import type { CategoriaPiatto } from '@/modules/menu/types/piatto'
import type { Evento } from '@/modules/menu/types/evento'

interface MenuComposerGridProps {
  voci: MenuVoce[]
  settimana: 0 | 1
  servizio: Servizio
  giorniLabels: string[]
  nomePiatto: (id: number | null) => string
  /** Categoria del piatto: colora la barra dello slot (carne/pesce/vegetariano). */
  categoriaPiatto: (id: number | null) => CategoriaPiatto | null
  /** Sola visualizzazione (ruolo cucina): nessuna azione di modifica. */
  readOnly?: boolean
  onAdd: (giorno: number, tipo: SezioneTipo) => void
  onRemove: (voceId: number) => void
  onAddContorno: (secondoVoceId: number) => void
  onRemoveContorno: (secondoVoceId: number) => void
  getFlag: (giorno: number, key: FlagKey) => boolean
  onToggleFlag: (giorno: number, key: FlagKey) => void
  getEventoId: (giorno: number) => string | null
  onSetEventoId: (giorno: number, id: string | null) => void
  eventi: Evento[]
  /** Click su un piatto della griglia: ne apre la scheda nell'elenco piatti. */
  onOpenPiatto?: (piattoId: number) => void
}

// ─── Helper: riga toggle ─────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string
  barColor: string
  chipText: string
  flagKey: FlagKey
  giorni: number[]
  readOnly?: boolean
  getFlag: (giorno: number, key: FlagKey) => boolean
  onToggleFlag: (giorno: number, key: FlagKey) => void
}

function ToggleRow({ label, barColor, chipText, flagKey, giorni, readOnly = false, getFlag, onToggleFlag }: ToggleRowProps) {
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
              <div className="w-full flex items-center gap-1.5 border border-[#D4D4D4] bg-white rounded px-2 py-1.5">
                <div className="shrink-0 rounded-sm" style={{ width: 3, height: 16, background: barColor }} />
                <span className="font-fraunces text-sm text-gray-600 flex-1 leading-tight truncate">{chipText}</span>
                {!readOnly && (
                  <button
                    type="button"
                    title="Nascondi"
                    onClick={() => onToggleFlag(giorno, flagKey)}
                    className="shrink-0 p-0.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                )}
              </div>
            ) : readOnly ? (
              <div className="w-full px-3 py-2 text-sm text-gray-300">—</div>
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

function EventoCell({ eventoId, eventi, readOnly = false, onSelect }: {
  eventoId: string | null
  eventi: Evento[]
  readOnly?: boolean
  onSelect: (id: string | null) => void
}) {
  const evento = eventi.find(e => e.id === eventoId)

  if (eventoId && evento) {
    return (
      <div className="w-full flex items-center gap-1.5 border border-amber-200 bg-amber-50 rounded px-2 py-1.5">
        <span className="font-fraunces text-sm text-amber-800 flex-1 leading-tight truncate">{evento.nome}</span>
        {!readOnly && (
          <button
            type="button"
            title="Rimuovi evento"
            onClick={() => onSelect(null)}
            className="shrink-0 p-0.5 rounded text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (readOnly) {
    return <div className="w-full px-2 py-1.5 text-xs text-gray-300">—</div>
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
  voci, settimana, servizio, giorniLabels, nomePiatto, categoriaPiatto, readOnly = false,
  onAdd, onRemove, onAddContorno, onRemoveContorno,
  getFlag, onToggleFlag, getEventoId, onSetEventoId, eventi, onOpenPiatto,
}: MenuComposerGridProps) {
  const giornoDi = (c: number) => settimana * 7 + c
  const giorni = giorniLabels.map((_, c) => giornoDi(c))

  // Un solo pass su voci per costruire la mappa "giorno:tipo" → voci ordinate.
  // Evita 28 chiamate filter() per render (7 giorni × 3 sezioni).
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

  // Quante righe occupa una sezione: quelle del giorno che ne usa di più,
  // contando anche lo slot "Aggiungi". Senza questo conteggio le posizioni che
  // nessun giorno usa resterebbero come righe vuote in fondo alla sezione.
  const righeSezione = (tipo: SezioneTipo): number => {
    let n = 1
    for (const giorno of giorni) {
      const usate = vociCella(giorno, tipo).length
      n = Math.max(n, Math.min(readOnly ? usate : usate + 1, SEZIONI_MAX[tipo]))
    }
    return n
  }

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

        {SEZIONI_ORDER.map(tipo => {
          const nRighe = righeSezione(tipo)
          return (
          <Fragment key={tipo}>
            {/* Una riga di tabella per POSIZIONE, non una per sezione: è la
                tabella stessa a tenere allineata la k-esima alternativa in tutti
                i giorni, anche quando i nomi occupano un numero diverso di righe
                di testo. Impilate dentro un'unica cella, ogni colonna scorreva
                per conto suo e le alternative si disallineavano fra i giorni. */}
            {Array.from({ length: nRighe }, (_, pos) => {
              const ultima = pos === nRighe - 1
              return (
                <tr key={pos}>
                  {/* l'etichetta di sezione si scrive una volta sola, a fianco
                      di tutte le righe di posizione */}
                  {pos === 0 && (
                    <td rowSpan={nRighe} className="py-2.5 pr-2 align-top border-b border-[#E5E5E5]">
                      <div className="flex items-center gap-1.5">
                        <div className="shrink-0 rounded-sm" style={{ width: 3, height: 18, background: TIPO_BAR[tipo] }} />
                        <span className="font-fraunces text-sm italic text-black leading-tight">{TIPO_LABEL[tipo]}</span>
                      </div>
                    </td>
                  )}
                  {giorni.map(giorno => {
                    const vs = vociCella(giorno, tipo)
                    const v = vs[pos]
                    return (
                      <td
                        key={giorno}
                        // py-0.75 sopra e sotto = i 6px che prima dava gap-1.5 fra
                        // due slot; sui bordi della sezione si torna a 6px pieni.
                        className={`px-1.5 py-0.75 align-top border-r border-r-[#E5E5E5]
                                    ${pos === 0 ? 'pt-1.5' : ''}
                                    ${ultima ? 'pb-1.5 border-b border-[#E5E5E5]' : ''}`}
                      >
                        {v ? (
                          tipo === 'secondi' && secondoHaContorno(pos) ? (
                            <SecondoBlock
                              nome={nomePiatto(v.piatto_id)}
                              piattoId={v.piatto_id}
                              categoria={categoriaPiatto(v.piatto_id)}
                              contornoNome={v.contorno_id != null ? nomePiatto(v.contorno_id) : null}
                              contornoId={v.contorno_id}
                              contornoCategoria={categoriaPiatto(v.contorno_id)}
                              readOnly={readOnly}
                              onRemove={() => onRemove(v.id)}
                              onAddContorno={() => onAddContorno(v.id)}
                              onRemoveContorno={() => onRemoveContorno(v.id)}
                              onOpenPiatto={onOpenPiatto}
                            />
                          ) : (
                            <PiattoSlot
                              nome={nomePiatto(v.piatto_id)}
                              piattoId={v.piatto_id}
                              tipo={tipo}
                              categoria={categoriaPiatto(v.piatto_id)}
                              onClick={onOpenPiatto ? () => onOpenPiatto(v.piatto_id) : undefined}
                              onRemove={readOnly ? undefined : () => onRemove(v.id)}
                            />
                          )
                        ) : !readOnly && pos === vs.length ? (
                          // lo slot "Aggiungi" resta subito sotto l'ultimo piatto del giorno
                          <PiattoSlot
                            tipo={tipo}
                            addLabel={tipo === 'secondi' ? 'Aggiungi secondo' : 'Aggiungi'}
                            onClick={() => onAdd(giorno, tipo)}
                          />
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {tipo === 'primi' && (
              <ToggleRow
                key="succhi"
                label="Succhi"
                barColor="#A3A3A3"
                chipText="Succhi di frutta"
                flagKey="show_succhi"
                giorni={giorni}
                readOnly={readOnly}
                getFlag={getFlag}
                onToggleFlag={onToggleFlag}
              />
            )}

            {tipo === 'secondi' && (
              <>
                <ToggleRow
                  key="insalate"
                  label="Insalate"
                  barColor="#A3A3A3"
                  chipText="Insalate miste dal buffet"
                  flagKey="show_insalate"
                  giorni={giorni}
                  readOnly={readOnly}
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
                  readOnly={readOnly}
                  getFlag={getFlag}
                  onToggleFlag={onToggleFlag}
                />
                {/* Il dessert non è più una sezione di piatti: chiude il pasto
                    come semplice riga di buffet, attivabile per giorno/servizio. */}
                <ToggleRow
                  key="buffet-dessert"
                  label="Buf. dessert"
                  barColor="#9E9E9E"
                  chipText="Buffet di dessert"
                  flagKey="show_buffet_dessert"
                  giorni={giorni}
                  readOnly={readOnly}
                  getFlag={getFlag}
                  onToggleFlag={onToggleFlag}
                />
              </>
            )}
          </Fragment>
          )
        })}

        {/* ── Riga evento speciale ─────────────────────────────────────
            In fondo, dopo le portate: l'evento è una nota sulla serata, non
            un passaggio della composizione del pasto. */}
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
                readOnly={readOnly}
                onSelect={(id) => onSetEventoId(giorno, id)}
              />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}
