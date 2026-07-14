import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Check, Plus, X, GripVertical, Info, Search, Salad, Leaf, MilkOff, ChefHat, Loader2 } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { useFooterConfig } from '@/modules/menu/hooks/useFooterConfig'
import { usePiatti } from '@/modules/menu/hooks/usePiatti'
import { formatPrezzo, parsePrezzo, SUPPL_PREFIX, wrapPiatti } from '@/modules/menu/lib/footer'
import type { Piatto } from '@/modules/menu/types/piatto'

function nomePiatto(p: Piatto, lingua: string): string {
  const campo = `nome_${lingua}` as keyof Piatto
  return (p[campo] as string | null | undefined) || p.nome_it
}

type Lingua = 'it' | 'en' | 'de' | 'fr'

const LINGUE: { value: Lingua; label: string }[] = [
  { value: 'it', label: 'IT' },
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
  { value: 'fr', label: 'FR' },
]

// Etichette statiche dell'anteprima stampata (replica del footer A4)
const PREVIEW_T: Record<Lingua, { sempre: string; allergen: string; veg: string; vgn: string; nl: string; loc: string }> = {
  it: { sempre: 'Sempre a Vostra scelta:', allergen: 'A richiesta singola ricetta con relativi allergeni', veg: 'vegetariano', vgn: 'vegano', nl: 'no lattosio', loc: 'KM0' },
  en: { sempre: 'Always available:', allergen: 'Allergen information available on request', veg: 'vegetarian', vgn: 'vegan', nl: 'lactose-free', loc: 'KM0' },
  de: { sempre: 'Immer verfügbar:', allergen: 'Auf Anfrage Einzelrezept mit Allergenenangaben', veg: 'vegetarisch', vgn: 'vegan', nl: 'laktosefrei', loc: 'KM0' },
  fr: { sempre: 'Toujours disponible :', allergen: 'Recette détaillée avec allergènes sur demande', veg: 'végétarien', vgn: 'vegan', nl: 'sans lattose', loc: 'KM0' },
}

interface SupplLocal { piatto_id: number | null; prezzo: string }

// ─── Ricerca inline piatto, selezione singola (per id) ────────────────────────

function PiattoSelect({ piattoId, onChange, piatti }: {
  piattoId: number | null
  onChange: (id: number) => void
  piatti: Piatto[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selezionato = piatti.find(p => p.id === piattoId) ?? null

  const opzioni = useMemo(() => {
    const q = query.trim().toLowerCase()
    return piatti
      .slice()
      .sort((a, b) => {
        if (a.tipo === 'se' && b.tipo !== 'se') return -1
        if (a.tipo !== 'se' && b.tipo === 'se') return 1
        return a.nome_it.localeCompare(b.nome_it)
      })
      .filter(p => !q || p.nome_it.toLowerCase().includes(q))
  }, [piatti, query])

  return (
    <div
      className="relative flex-1"
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setOpen(false); setQuery('') } }}
    >
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        value={open ? query : (selezionato?.nome_it ?? '')}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { setOpen(true); setQuery('') }}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
        placeholder="Cerca dall'elenco piatti…"
        className="h-10 pl-8 pr-3 w-full rounded-[9px] border border-[#DEDEDE] text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors"
      />
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-[9px] border border-[#DEDEDE] bg-white shadow-lg py-1">
          {opzioni.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Nessun piatto trovato</p>
          ) : opzioni.map(p => (
            <button
              key={p.id}
              type="button"
              // preventDefault: evita che il click tolga il focus all'input (su
              // Safari/Firefox i button non ricevono focus) facendo scattare l'onBlur
              // del contenitore, che chiuderebbe il menu prima dell'onClick.
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(p.id); setOpen(false); setQuery('') }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${p.id === piattoId ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
            >
              {p.nome_it}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Ricerca inline piatto, selezione multipla (chips) ────────────────────────

function PiattiMultiSelect({ piattoIds, onChange, piatti }: {
  piattoIds: number[]
  onChange: (ids: number[]) => void
  piatti: Piatto[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const opzioni = useMemo(() => {
    const q = query.trim().toLowerCase()
    return piatti
      .filter(p => !piattoIds.includes(p.id))
      .slice()
      .sort((a, b) => a.nome_it.localeCompare(b.nome_it))
      .filter(p => !q || p.nome_it.toLowerCase().includes(q))
  }, [piatti, query, piattoIds])

  const add = (id: number) => { onChange([...piattoIds, id]); setQuery(''); setOpen(false) }
  const remove = (id: number) => onChange(piattoIds.filter(x => x !== id))

  return (
    <div
      className="relative flex-1"
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setOpen(false); setQuery('') } }}
    >
      <div className="min-h-10 w-full rounded-[9px] border border-[#DEDEDE] px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-gray-400 transition-colors">
        {piattoIds.map(id => {
          const p = piatti.find(x => x.id === id)
          if (!p) return null
          return (
            <span key={id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[12.5px] rounded-md pl-2 pr-1 py-1">
              {p.nome_it}
              <button type="button" onClick={() => remove(id)} className="text-gray-400 hover:text-red-500 rounded p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )
        })}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={piattoIds.length === 0 ? "Cerca dall'elenco piatti…" : 'Aggiungi…'}
          className="flex-1 min-w-[100px] text-sm outline-none py-1"
        />
      </div>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-[9px] border border-[#DEDEDE] bg-white shadow-lg py-1">
          {opzioni.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Nessun piatto trovato</p>
          ) : opzioni.map(p => (
            <button
              key={p.id}
              type="button"
              // preventDefault: vedi PiattoSelect — tiene il focus sull'input così
              // l'onBlur non chiude il menu prima che scatti l'onClick di aggiunta.
              onMouseDown={e => e.preventDefault()}
              onClick={() => add(p.id)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              {p.nome_it}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Anteprima stampa (foglio bianco, Georgia serif) ──────────────────────────

function StampaFooterPreview({ lingua, righe, supplementi }: { lingua: Lingua; righe: string[]; supplementi: { piatto: string; prezzo: string }[] }) {
  const t = PREVIEW_T[lingua]
  const righeVis = righe.filter(r => r.trim() !== '')
  const supplVis = supplementi.filter(s => s.piatto.trim() !== '')

  return (
    <div
      className="mx-auto"
      style={{
        background: '#fff',
        borderRadius: 4,
        padding: '30px 40px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
        border: '1px solid #DEDEDE',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#111',
        maxWidth: 560,
      }}
    >
      <div style={{ textAlign: 'center', color: '#999', fontSize: 13, marginBottom: 12 }}>
        … fine portate del giorno …
      </div>
      <hr style={{ borderColor: '#bbb', borderWidth: '0 0 1px', margin: '0 0 12px' }} />

      <div style={{ textAlign: 'center', fontSize: 13.5, lineHeight: 1.55, color: '#222' }}>
        <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 14 }}>{t.sempre}</div>
        {righeVis.length > 0
          ? righeVis.map((r, i) => <div key={i}>{r}</div>)
          : <div style={{ color: '#bbb' }}>—</div>}
        {supplVis.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontWeight: 700 }}>{SUPPL_PREFIX[lingua]}</span>{' '}
            {supplVis.map((s, i) => (
              <span key={i}>
                {i > 0 && <span style={{ color: '#aaa' }}>{'  –  '}</span>}
                {s.piatto} € {formatPrezzo(parsePrezzo(s.prezzo))}
              </span>
            ))}
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#bbb', borderWidth: '0 0 1px', margin: '12px 0 8px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'system-ui, Arial, sans-serif', fontSize: 11, color: '#333' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Salad size={16} strokeWidth={2} color="#333" /> {t.veg}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Leaf size={16} strokeWidth={2} color="#333" /> {t.vgn}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MilkOff size={16} strokeWidth={2} color="#333" /> {t.nl}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ChefHat size={16} strokeWidth={2} color="#333" /> {t.loc}</span>
        </div>
        <div style={{ fontStyle: 'italic', textAlign: 'right' }}>{t.allergen}</div>
      </div>
    </div>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function Impostazioni() {
  const { loading, saving, righe: righeDb, supplementi: supplDb, saveFooter } = useFooterConfig()
  const { piatti } = usePiatti()
  const [linguaPreview, setLinguaPreview] = useState<Lingua>('it')
  const [righe, setRighe] = useState<number[]>([])
  const [supplementi, setSupplementi] = useState<SupplLocal[]>([])
  const [saved, setSaved] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  // Drag&drop supplementi (HTML5 nativo, niente librerie):
  //  · dragRow: riga che si sta trascinando (draggable attivo solo su questa,
  //    per non intercettare la selezione del testo negli input)
  //  · overRow: riga sotto il cursore, per l'evidenziazione del punto di rilascio
  const [dragRow, setDragRow] = useState<number | null>(null)
  const [overRow, setOverRow] = useState<number | null>(null)

  // snapshot salvato (per dirty-check)
  const baseRighe = useMemo<number[]>(() => righeDb.map(r => r.piatto_id), [righeDb])
  const baseSuppl = useMemo<SupplLocal[]>(
    () => supplDb.map(s => ({ piatto_id: s.piatto_id, prezzo: formatPrezzo(s.prezzo) })),
    [supplDb],
  )

  // carica lo stato locale al primo caricamento (reset-durante-render)
  const [loaded, setLoaded] = useState(false)
  if (!loading && !loaded) {
    setLoaded(true)
    setRighe(baseRighe)
    setSupplementi(baseSuppl)
  }

  // Chiave sulla forma *canonica* (quella che verrà persistita): le righe di
  // supplemento senza piatto scelto non si salvano, quindi non contano come
  // modifica — altrimenti l'autosave ripartirebbe all'infinito su una riga
  // vuota. I prezzi si confrontano come numeri, non come testo.
  const localKey = useMemo(
    () => JSON.stringify({
      righe,
      suppl: supplementi
        .filter(s => s.piatto_id != null)
        .map(s => ({ piatto_id: s.piatto_id, prezzo: parsePrezzo(s.prezzo) })),
    }),
    [righe, supplementi],
  )
  const baseKey = useMemo(
    () => JSON.stringify({ righe: baseRighe, suppl: supplDb.map(s => ({ piatto_id: s.piatto_id, prezzo: s.prezzo })) }),
    [baseRighe, supplDb],
  )
  const needsSave = localKey !== baseKey

  // payload che ha già fallito: evita che l'autosave ritenti a ciclo lo stesso
  // contenuto (es. permessi mancanti). Riparte non appena il contenuto cambia.
  const lastFailedRef = useRef<string | null>(null)

  const salva = useCallback(async (key: string) => {
    setErrore(null)
    const err = await saveFooter(
      righe.map(piatto_id => ({ piatto_id })),
      supplementi
        .filter((s): s is { piatto_id: number; prezzo: string } => s.piatto_id != null)
        .map(s => ({ piatto_id: s.piatto_id, prezzo: parsePrezzo(s.prezzo) })),
    )
    if (err) { setErrore(err); lastFailedRef.current = key; return }
    lastFailedRef.current = null
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }, [righe, supplementi, saveFooter])

  // Salvataggio automatico: dopo ogni modifica (con debounce) persiste da solo,
  // niente pulsante manuale.
  useEffect(() => {
    if (!loaded || !needsSave || saving) return
    if (lastFailedRef.current === localKey) return
    const t = setTimeout(() => { void salva(localKey) }, 700)
    return () => clearTimeout(t)
  }, [loaded, needsSave, saving, localKey, salva])

  // mutators supplementi
  const addSuppl = () => setSupplementi(s => [...s, { piatto_id: null, prezzo: '' }])
  const setSuppl = (i: number, patch: Partial<SupplLocal>) =>
    setSupplementi(s => s.map((x, idx) => idx === i ? { ...x, ...patch } : x))
  const delSuppl = (i: number) => setSupplementi(s => s.filter((_, idx) => idx !== i))
  const moveSuppl = (from: number, to: number) => setSupplementi(s => {
    if (from === to || to < 0 || to >= s.length) return s
    const next = s.slice()
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    return next
  })
  const endDrag = () => { setDragRow(null); setOverRow(null) }

  const inputCls = 'h-10 px-3 rounded-[9px] border border-[#DEDEDE] text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors'
  const dashedBtn = 'inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-[9px] border border-dashed border-[#D4D4D4] text-gray-500 text-[13.5px] font-medium hover:border-gray-400 hover:text-gray-700 transition-colors self-start'

  // dati risolti per l'anteprima nella lingua scelta — l'impaginazione su
  // più righe stampate è automatica, in base alla lunghezza del testo
  const previewRighe = wrapPiatti(
    righe
      .map(id => piatti.find(p => p.id === id))
      .filter((p): p is Piatto => !!p)
      .map(p => nomePiatto(p, linguaPreview)),
  )
  const previewSuppl = supplementi.map(s => {
    const p = s.piatto_id != null ? piatti.find(x => x.id === s.piatto_id) : undefined
    return { piatto: p ? nomePiatto(p, linguaPreview) : '', prezzo: s.prezzo }
  })

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Configurazione"
        title="Footer menù"
        subtitle="Il blocco «Sempre a Vostra scelta» in fondo a ogni pagina stampata — stessi piatti, tradotti in 4 lingue"
        actions={
          <div className="inline-flex items-center gap-2 h-[42px] text-[13.5px] font-medium whitespace-nowrap select-none">
            {saving ? (
              <span className="inline-flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Salvataggio…
              </span>
            ) : needsSave ? (
              <span className="inline-flex items-center gap-2 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Modifiche non salvate
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-gray-500">
                <Check className="w-4 h-4 text-green-600" /> {saved ? 'Salvato' : 'Salvataggio automatico'}
              </span>
            )}
          </div>
        }
      />

      {errore && (
        <div className="mx-9 mt-4 rounded-[10px] px-4 py-3 text-[13px] leading-snug bg-red-50 border border-red-200 text-red-700">
          Salvataggio non riuscito: {errore}
        </div>
      )}

      {loading ? (
        <div className="flex-1 p-10 text-sm text-gray-400">Caricamento…</div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* EDITOR */}
          <div className="shrink-0 overflow-auto p-9 flex flex-col gap-8" style={{ flex: '0 0 600px' }}>

            {/* Sezione righe */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-gray-700">Sempre a Vostra scelta</h2>
                <span className="text-[11.5px] text-gray-400">l'impaginazione su più righe è automatica</span>
              </div>
              <PiattiMultiSelect piattoIds={righe} onChange={setRighe} piatti={piatti} />
            </section>

            {/* Sezione supplementi */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-gray-700">Con supplemento</h2>
                <span className="text-[11.5px] text-gray-400">stessi piatti in tutte le lingue</span>
              </div>

              {supplementi.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <span className="w-[18px] shrink-0" />
                  <span className="flex-1 text-[11px] uppercase tracking-[0.4px] text-gray-400">Piatto (dall'elenco piatti)</span>
                  <span className="w-[116px] text-[11px] uppercase tracking-[0.4px] text-gray-400">Prezzo</span>
                  <span className="w-8 shrink-0" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                {supplementi.map((s, i) => (
                  <div
                    key={i}
                    draggable={dragRow === i}
                    onDragStart={e => { setDragRow(i); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={e => { if (dragRow !== null) { e.preventDefault(); setOverRow(i) } }}
                    onDrop={e => { e.preventDefault(); if (dragRow !== null) moveSuppl(dragRow, i); endDrag() }}
                    onDragEnd={endDrag}
                    className={`flex items-center gap-2 rounded-[9px] transition-colors ${dragRow === i ? 'opacity-50' : ''} ${overRow === i && dragRow !== null && dragRow !== i ? 'ring-2 ring-gray-300' : ''}`}
                  >
                    <GripVertical
                      // draggable si attiva solo mentre si tiene la maniglia, così
                      // il resto della riga (input) resta selezionabile col mouse
                      onMouseDown={() => setDragRow(i)}
                      onMouseUp={() => { if (overRow === null) setDragRow(null) }}
                      className="w-[18px] h-[18px] text-gray-300 shrink-0 cursor-grab active:cursor-grabbing"
                    />
                    <PiattoSelect
                      piattoId={s.piatto_id}
                      onChange={id => setSuppl(i, { piatto_id: id })}
                      piatti={piatti}
                    />
                    <div className="relative w-[116px] shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">€</span>
                      <input
                        value={s.prezzo}
                        onChange={e => setSuppl(i, { prezzo: e.target.value })}
                        inputMode="decimal"
                        placeholder="0,00"
                        className={`${inputCls} w-full pl-[26px] text-right`}
                      />
                    </div>
                    <button onClick={() => delSuppl(i)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0">
                      <X className="w-[15px] h-[15px]" />
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={addSuppl} className={dashedBtn}>
                <Plus className="w-4 h-4" /> Aggiungi supplemento
              </button>

              <div className="flex gap-2.5 rounded-[10px] mt-1" style={{ padding: '14px 16px', background: '#FBF6EE', border: '1px solid #ECE0CE' }}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B98A45' }} />
                <p className="text-[12.5px] leading-snug" style={{ color: '#7A5A2E' }}>
                  Ogni piatto va scelto dall'elenco piatti: nome tradotto e prezzo sono unici e validi per tutte le lingue. Se manca, crealo prima in «Elenco piatti».
                </p>
              </div>
            </section>
          </div>

          {/* ANTEPRIMA */}
          <div className="flex-1 overflow-auto p-9 border-l border-gray-200" style={{ background: '#EFEDE9' }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                Anteprima · come apparirà stampato
              </p>
              <div className="flex gap-0.5">
                {LINGUE.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setLinguaPreview(l.value)}
                    className={`px-1.5 py-0.5 text-[11px] font-semibold rounded transition-colors ${linguaPreview === l.value ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <StampaFooterPreview lingua={linguaPreview} righe={previewRighe} supplementi={previewSuppl} />
            <p className="text-[12px] text-gray-500 mt-4 text-center">
              Aggiornato in tutti i menù, in tutte le lingue, al salvataggio
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
