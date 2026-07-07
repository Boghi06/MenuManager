import { useState, useRef, useMemo, type CSSProperties } from 'react'
import { X, Printer, Salad, Leaf, MilkOff, ChefHat, type LucideIcon } from 'lucide-react'
import { getBisettimanaRange } from '@/modules/menu/lib/bisettimane'
import { useFooterConfig } from '@/modules/menu/hooks/useFooterConfig'
import { formatPrezzo, SUPPL_PREFIX, wrapPiatti } from '@/modules/menu/lib/footer'
import type { FlagKey, MenuVoce, Servizio } from '@/modules/menu/types/menuVoce'
import type { Piatto } from '@/modules/menu/types/piatto'
import type { Evento } from '@/modules/menu/types/evento'

// ─── Types ──────────────────────────────────────────────────────────────────

type Lingua = 'it' | 'en' | 'de' | 'fr'

interface StampaPreviewProps {
  open: boolean
  onClose: () => void
  voci: MenuVoce[]
  piatti: Piatto[]
  anno: number
  mese: number
  bisettimanaIdx: 1 | 2
  getFlag: (giorno: number, servizio: Servizio, key: FlagKey) => boolean
  getEvento: (giorno: number, servizio: Servizio) => string | null
  eventi: Evento[]
}

// ─── Static translations ────────────────────────────────────────────────────

const T = {
  it: {
    lunch: 'PRANZO', lunchTime: '12.40 – 13.30',
    dinner: 'CENA', dinnerTime: '19.30 – 20.30',
    luogo: 'Montegrotto Terme',
    succhi: 'Scelta di succhi di frutta o di pomodoro',
    insalate: 'Insalate miste dal buffet',
    formaggi: 'Scelta di formaggi tradizionali',
    buffetDessert: 'Buffet di dessert',
    sempre: 'Sempre a Vostra scelta:',
    sempreR1: 'Pennette al pomodoro Siciliano o al ragù bolognese, Omelette alle erbe dei Colli Euganei',
    sempreR2: 'Petti di pollo,  Finissima di manzo,  Escaloppe di maiale alla griglia',
    sempreSuppl: 'Con supplemento:  Entrecôte di manzo € 7,00  –  Costolette di agnello € 7,00  –  Filetto di manzo € 10,00',
    veg: 'vegetariano', vgn: 'vegano', nl: 'no lattosio', loc: 'veneziano',
    allergen: 'A richiesta singola ricetta con relativi allergeni',
    settimana1: 'Settimana 1', settimana2: 'Settimana 2',
    antLabel: 'Antipasto', prLabel: 'Primi', seLabel: 'Secondi', desLabel: 'Dessert',
  },
  en: {
    lunch: 'LUNCH', lunchTime: '12.40 – 1.30 pm',
    dinner: 'DINNER', dinnerTime: '7.30 – 8.30 pm',
    luogo: 'Montegrotto Terme',
    succhi: 'Selection of fruit juices or tomato juice',
    insalate: 'Mixed salads from the buffet',
    formaggi: 'Selection of traditional cheeses',
    buffetDessert: 'Dessert buffet',
    sempre: 'Always available:',
    sempreR1: 'Penne with Sicilian tomato sauce or Bolognese ragù, Herb omelette from the Euganean Hills',
    sempreR2: 'Chicken breast,  Lean beef,  Grilled pork escalope',
    sempreSuppl: 'With supplement:  Beef entrecôte € 7.00  –  Lamb chops € 7.00  –  Beef fillet € 10.00',
    veg: 'vegetarian', vgn: 'vegan', nl: 'lactose-free', loc: 'venetian',
    allergen: 'Allergen information available on request',
    settimana1: 'Week 1', settimana2: 'Week 2',
    antLabel: 'Starter', prLabel: 'First courses', seLabel: 'Main courses', desLabel: 'Dessert',
  },
  de: {
    lunch: 'MITTAGESSEN', lunchTime: '12.40 – 13.30 Uhr',
    dinner: 'ABENDESSEN', dinnerTime: '19.30 – 20.30 Uhr',
    luogo: 'Montegrotto Terme',
    succhi: 'Auswahl an Frucht- oder Tomatensäften',
    insalate: 'Gemischter Salat vom Buffet',
    formaggi: 'Auswahl an traditionellen Käsesorten',
    buffetDessert: 'Dessertbuffet',
    sempre: 'Immer verfügbar:',
    sempreR1: 'Penne mit sizilianischer Tomatensauce oder Bolognese, Kräuteromelett aus den Euganäischen Hügeln',
    sempreR2: 'Hühnerbrust,  Rinderfilet fein,  Gegrillte Schweineeschnitzel',
    sempreSuppl: 'Mit Aufpreis:  Rinderentrecôte € 7,00  –  Lammkoteletts € 7,00  –  Rinderfilet € 10,00',
    veg: 'vegetarisch', vgn: 'vegan', nl: 'laktosefrei', loc: 'venezianisch',
    allergen: 'Auf Anfrage Einzelrezept mit Allergenenangaben',
    settimana1: 'Woche 1', settimana2: 'Woche 2',
    antLabel: 'Vorspeise', prLabel: 'Erste Gänge', seLabel: 'Hauptgänge', desLabel: 'Dessert',
  },
  fr: {
    lunch: 'DÉJEUNER', lunchTime: '12h40 – 13h30',
    dinner: 'DÎNER', dinnerTime: '19h30 – 20h30',
    luogo: 'Montegrotto Terme',
    succhi: 'Sélection de jus de fruits ou de tomate',
    insalate: 'Salades mélangées du buffet',
    formaggi: 'Sélection de fromages traditionnels',
    buffetDessert: 'Buffet de desserts',
    sempre: 'Toujours disponible :',
    sempreR1: 'Pennette à la tomate sicilienne ou au ragù bolognaise, Omelette aux herbes des Collines Euganéennes',
    sempreR2: 'Blanc de poulet,  Filet de bœuf haché,  Escalope de porc grillée',
    sempreSuppl: 'Avec supplément :  Entrecôte de bœuf € 7,00  –  Côtelettes d\'agneau € 7,00  –  Filet de bœuf € 10,00',
    veg: 'végétarien', vgn: 'vegan', nl: 'sans lactose', loc: 'vénitien',
    allergen: 'Recette détaillée avec allergènes sur demande',
    settimana1: 'Semaine 1', settimana2: 'Semaine 2',
    antLabel: 'Entrée', prLabel: 'Premiers plats', seLabel: 'Plats principaux', desLabel: 'Dessert',
  },
} satisfies Record<Lingua, Record<string, string>>

const GIORNI_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MESI_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDayLabel(d: Date): string {
  return `${GIORNI_IT[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} ${MESI_IT[d.getMonth()]}`
}

function formatDateHeader(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function nomePiatto(p: Piatto, lingua: Lingua): string {
  const campo = `nome_${lingua}` as keyof Piatto
  return (p[campo] as string | null | undefined) || p.nome_it
}

// ─── Badge row for a single piatto ──────────────────────────────────────────

function BadgeRow({ p, lingua }: { p: Piatto; lingua: Lingua }) {
  const t = T[lingua]
  const items: { Icon: LucideIcon; title: string }[] = []
  if (p.vegetariano)  items.push({ Icon: Salad,   title: t.veg })
  if (p.vegano)       items.push({ Icon: Leaf,    title: t.vgn })
  if (p.no_lattosio)  items.push({ Icon: MilkOff, title: t.nl })
  if (p.locale)       items.push({ Icon: ChefHat, title: t.loc })
  if (items.length === 0) return null
  return (
    <span style={{ marginLeft: 4, display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
      {items.map((b, i) => (
        <b.Icon key={i} size={10} strokeWidth={2} color="#444" />
      ))}
    </span>
  )
}

// ─── Small ornamental separator (fixed size, not a flex spacer) ─────────────

function Sep() {
  return (
    <div style={{ textAlign: 'center', color: '#ccc', fontSize: 9, letterSpacing: 4, margin: '3px 0' }}>
      ——
    </div>
  )
}

interface FooterResolved {
  righe: { id: string; testo: string }[]
  supplementi: { id: string; piatto: string; prezzo: number }[]
}

// ─── One column (pranzo or cena) ─────────────────────────────────────────────

interface ColonnaProps {
  servizio: Servizio
  giorno: number
  voci: MenuVoce[]
  piattoMap: Map<number, Piatto>
  lingua: Lingua
  showSucchi: boolean
  showInsalate: boolean
  showFormaggi: boolean
  showBuffetDessert: boolean
  evento?: Evento | null
}

function Colonna({ servizio, giorno, voci, piattoMap, lingua, showSucchi, showInsalate, showFormaggi, showBuffetDessert, evento }: ColonnaProps) {
  const t = T[lingua]

  const filtrati = (tipo: string) =>
    voci
      .filter(v => v.giorno === giorno && v.servizio === servizio && v.tipo === tipo)
      .sort((a, b) => a.posizione - b.posizione)

  const antipasti = filtrati('ant')
  const primi     = filtrati('pr')
  const secondi   = filtrati('se')
  const dessert   = filtrati('des')

  // Column: 5 content blocks separated by space-between.
  // The ornamental Sep sits at the TOP of blocks 2–5 (inside each block)
  // so the gap from space-between appears before the separator line.
  const colStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }

  const innerStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const blockStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  }

  const dishStyle: CSSProperties = {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 17,
    color: '#111',
    lineHeight: 1.45,
    textAlign: 'center',
  }

  const subStyle: CSSProperties = {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 15,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
  }

  return (
    <div style={colStyle}>

      {/* ── Se c'è un evento, sostituisce tutte le portate ─────────── */}
      {evento ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, color: '#111', textAlign: 'center', lineHeight: 1.3 }}>
            {evento.nome}
          </div>
          {evento.immagine_url && (
            <img
              src={evento.immagine_url}
              alt={evento.nome}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}
            />
          )}
          {evento.sottotitolo && (
            <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 18, fontStyle: 'italic', color: '#444', textAlign: 'center' }}>
              {evento.sottotitolo}
            </div>
          )}
        </div>
      ) : (
      <div style={innerStyle}>

        {/* ── Block 1: Antipasto ─────────────────── */}
        <div style={blockStyle}>
          {antipasti.map(v => {
            const p = piattoMap.get(v.piatto_id)
            if (!p) return null
            return (
              <div key={v.id} style={dishStyle}>
                {nomePiatto(p, lingua)}<BadgeRow p={p} lingua={lingua} />
              </div>
            )
          })}
          {antipasti.length === 0 && <div style={{ ...dishStyle, color: '#ccc' }}>—</div>}
        </div>

        {/* ── Block 2: Primi + Succhi ────────────── */}
        <div style={blockStyle}>
          <Sep />
          {primi.map(v => {
            const p = piattoMap.get(v.piatto_id)
            if (!p) return null
            return (
              <div key={v.id} style={dishStyle}>
                {nomePiatto(p, lingua)}<BadgeRow p={p} lingua={lingua} />
              </div>
            )
          })}
          {primi.length === 0 && <div style={{ ...dishStyle, color: '#ccc' }}>—</div>}
          {showSucchi && <div style={dishStyle}>{t.succhi}</div>}
        </div>

        {/* ── Block 3: Secondi ──────────────────── */}
        <div style={blockStyle}>
          <Sep />
          {secondi.map(v => {
            const p = piattoMap.get(v.piatto_id)
            if (!p) return null
            const contorno = v.contorno_id ? piattoMap.get(v.contorno_id) : null
            return (
              <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={dishStyle}>
                  {nomePiatto(p, lingua)}<BadgeRow p={p} lingua={lingua} />
                </div>
                {contorno && (
                  <div style={subStyle}>
                    {nomePiatto(contorno, lingua)}<BadgeRow p={contorno} lingua={lingua} />
                  </div>
                )}
              </div>
            )
          })}
          {secondi.length === 0 && <div style={{ ...dishStyle, color: '#ccc' }}>—</div>}
        </div>

        {/* ── Block 4: Insalate + Formaggi ─────── */}
        <div style={blockStyle}>
          <Sep />
          {showInsalate && <div style={dishStyle}>{t.insalate}</div>}
          {showInsalate && showFormaggi && <Sep />}
          {showFormaggi && <div style={dishStyle}>{t.formaggi}</div>}
          {!showInsalate && !showFormaggi && <div style={{ ...dishStyle, color: '#ddd' }}>—</div>}
        </div>

        {/* ── Block 5: Dessert ─────────────────── */}
        <div style={blockStyle}>
          <Sep />
          {dessert.map(v => {
            const p = piattoMap.get(v.piatto_id)
            if (!p) return null
            return (
              <div key={v.id} style={dishStyle}>
                {nomePiatto(p, lingua)}<BadgeRow p={p} lingua={lingua} />
              </div>
            )
          })}
          {showBuffetDessert && <div style={dishStyle}>{t.buffetDessert}</div>}
          {dessert.length === 0 && !showBuffetDessert && <div style={{ ...dishStyle, color: '#ccc' }}>—</div>}
        </div>

      </div>
      )}
    </div>
  )
}

// ─── A4 page (all inline styles — safe to copy innerHTML for printing) ───────

interface A4PageProps {
  giorno: number
  data: Date
  lingua: Lingua
  voci: MenuVoce[]
  piattoMap: Map<number, Piatto>
  flagsPranzo: { succhi: boolean; insalate: boolean; formaggi: boolean; buffetDessert: boolean }
  flagsCena:   { succhi: boolean; insalate: boolean; formaggi: boolean; buffetDessert: boolean }
  eventoPranzo?: Evento | null
  eventoCena?: Evento | null
  footer: FooterResolved
}

function A4Page({ giorno, data, lingua, voci, piattoMap, flagsPranzo, flagsCena, eventoPranzo, eventoCena, footer }: A4PageProps) {
  const t = T[lingua]

  const pageStyle: CSSProperties = {
    width: 1123,
    height: 794,
    background: '#fff',
    boxSizing: 'border-box',
    padding: '36px 52px 28px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#111',
    position: 'relative',
    overflow: 'hidden',
  }

  const headerLabelStyle: CSSProperties = {
    fontFamily: 'system-ui, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#111',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div style={pageStyle}>
      {/* ── Page header ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={headerLabelStyle}>
          {t.lunch} {t.lunchTime}
        </div>
        <div style={{ fontFamily: 'system-ui, Arial, sans-serif', fontSize: 17, fontWeight: 700, textAlign: 'center', color: '#111' }}>
          {t.luogo}, {formatDateHeader(data)}
        </div>
        <div style={headerLabelStyle}>
          {t.dinner} {t.dinnerTime}
        </div>
      </div>

      <hr style={{ borderColor: '#ccc', borderWidth: '0 0 1px', margin: '0 0 10px' }} />

      {/* ── Two columns ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 28, flex: 1 }}>
        <Colonna
          servizio="pranzo"
          giorno={giorno}
          voci={voci}
          piattoMap={piattoMap}
          lingua={lingua}
          showSucchi={flagsPranzo.succhi}
          showInsalate={flagsPranzo.insalate}
          showFormaggi={flagsPranzo.formaggi}
          showBuffetDessert={flagsPranzo.buffetDessert}
          evento={eventoPranzo}
        />

        <div style={{ width: 1, background: '#ddd', flexShrink: 0, alignSelf: 'stretch' }} />

        <Colonna
          servizio="cena"
          giorno={giorno}
          voci={voci}
          piattoMap={piattoMap}
          lingua={lingua}
          showSucchi={flagsCena.succhi}
          showInsalate={flagsCena.insalate}
          showFormaggi={flagsCena.formaggi}
          showBuffetDessert={flagsCena.buffetDessert}
          evento={eventoCena}
        />
      </div>

      {/* ── Bottom separator ─────────────────────────── */}
      <hr style={{ borderColor: '#bbb', borderWidth: '0 0 1px', margin: '12px 0 8px' }} />

      {/* ── Sempre a vostra scelta ───────────────────── */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'system-ui, Arial, sans-serif',
        fontSize: 13,
        color: '#222',
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.sempre}</div>
        {footer.righe.length > 0
          ? footer.righe.map(r => <div key={r.id}>{r.testo}</div>)
          : (<><div>{t.sempreR1}</div><div>{t.sempreR2}</div></>)}
        {footer.supplementi.length > 0 ? (
          <div style={{ marginTop: 3 }}>
            <span style={{ fontWeight: 700 }}>{SUPPL_PREFIX[lingua]}</span>{' '}
            {footer.supplementi.map((s, i) => (
              <span key={s.id}>
                {i > 0 && <span style={{ color: '#999' }}>{'  –  '}</span>}
                {s.piatto} € {formatPrezzo(s.prezzo)}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 3 }}>{t.sempreSuppl}</div>
        )}
      </div>

      <hr style={{ borderColor: '#bbb', borderWidth: '0 0 1px', margin: '8px 0 6px' }} />

      {/* ── Legend row ────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'system-ui, Arial, sans-serif',
        fontSize: 11,
        color: '#333',
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Salad size={13} strokeWidth={2} color="#333" /> {t.veg}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Leaf size={13} strokeWidth={2} color="#333" /> {t.vgn}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MilkOff size={13} strokeWidth={2} color="#333" /> {t.nl}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ChefHat size={13} strokeWidth={2} color="#333" /> {t.loc}</span>
        </div>
        <div style={{ fontStyle: 'italic', textAlign: 'right' }}>{t.allergen}</div>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function StampaPreview({ open, onClose, voci, piatti, anno, mese, bisettimanaIdx, getFlag, getEvento, eventi }: StampaPreviewProps) {
  const [lingua, setLingua] = useState<Lingua>('it')
  const [giorno, setGiorno] = useState<number>(0)
  const printRef = useRef<HTMLDivElement>(null)
  const { righe, supplementi } = useFooterConfig()

  const eventoMap = useMemo(() => {
    const m = new Map<string, Evento>()
    for (const e of eventi) m.set(e.id, e)
    return m
  }, [eventi])

  const resolveEvento = (g: number, s: Servizio): Evento | null => {
    const id = getEvento(g, s)
    return id ? (eventoMap.get(id) ?? null) : null
  }

  const piattoMap = useMemo(() => {
    const m = new Map<number, Piatto>()
    for (const p of piatti) m.set(p.id, p)
    return m
  }, [piatti])

  const giorni = useMemo(() => {
    const { start } = getBisettimanaRange(anno, mese, bisettimanaIdx)
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [anno, mese, bisettimanaIdx])

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const html = el.innerHTML
    const win = window.open('', '_blank', 'width=1200,height=860')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="${lingua}">
<head>
  <meta charset="UTF-8">
  <title>Menu ${formatDateHeader(giorni[giorno])}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    @page { size: A4 landscape; margin: 0; }
    @media print { html, body { width: 297mm; height: 210mm; } }
  </style>
</head>
<body>${html}</body>
</html>`)
    win.document.close()
    setTimeout(() => { win.print(); }, 400)
  }

  if (!open) return null

  const selectedDate = giorni[giorno]
  const nomiSempre = righe
    .map(r => piattoMap.get(r.piatto_id))
    .filter((p): p is Piatto => !!p)
    .map(p => nomePiatto(p, lingua))

  const footer: FooterResolved = {
    righe: wrapPiatti(nomiSempre).map((testo, i) => ({ id: String(i), testo })),
    supplementi: supplementi.reduce<{ id: string; piatto: string; prezzo: number }[]>((acc, s) => {
      const p = piattoMap.get(s.piatto_id)
      if (p) acc.push({ id: s.id, piatto: nomePiatto(p, lingua), prezzo: s.prezzo })
      return acc
    }, []),
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  const modalStyle: CSSProperties = {
    width: '95vw', height: '95vh',
    background: '#f0f0f0', borderRadius: 10,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* ── Modal header ─────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <span className="font-semibold text-[15px] text-black">Anteprima stampa</span>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            {(['it', 'en', 'de', 'fr'] as Lingua[]).map(l => (
              <button
                key={l}
                onClick={() => setLingua(l)}
                className={`px-3 py-1 text-xs font-semibold rounded border transition-colors
                  ${lingua === l
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
            <button
              onClick={onClose}
              className="ml-2 p-1.5 text-gray-500 hover:text-black transition-colors rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Modal body ───────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar: day picker */}
          <div className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="flex-1 px-3 py-4 flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                {T[lingua].settimana1}
              </p>
              {giorni.slice(0, 7).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setGiorno(i)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors
                    ${giorno === i ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-4 mb-2">
                {T[lingua].settimana2}
              </p>
              {giorni.slice(7).map((d, i) => (
                <button
                  key={i + 7}
                  onClick={() => setGiorno(i + 7)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors
                    ${giorno === i + 7 ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
            </div>

            {/* Print button */}
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Stampa PDF
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6">
            <div
              style={{
                transform: 'scale(0.65)',
                transformOrigin: 'top center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              }}
            >
              <div ref={printRef}>
                <A4Page
                  giorno={giorno}
                  data={selectedDate}
                  lingua={lingua}
                  voci={voci}
                  piattoMap={piattoMap}
                  flagsPranzo={{
                    succhi:        getFlag(giorno, 'pranzo', 'show_succhi'),
                    insalate:      getFlag(giorno, 'pranzo', 'show_insalate'),
                    formaggi:      getFlag(giorno, 'pranzo', 'show_formaggi'),
                    buffetDessert: getFlag(giorno, 'pranzo', 'show_buffet_dessert'),
                  }}
                  flagsCena={{
                    succhi:        getFlag(giorno, 'cena', 'show_succhi'),
                    insalate:      getFlag(giorno, 'cena', 'show_insalate'),
                    formaggi:      getFlag(giorno, 'cena', 'show_formaggi'),
                    buffetDessert: getFlag(giorno, 'cena', 'show_buffet_dessert'),
                  }}
                  eventoPranzo={resolveEvento(giorno, 'pranzo')}
                  eventoCena={resolveEvento(giorno, 'cena')}
                  footer={footer}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
