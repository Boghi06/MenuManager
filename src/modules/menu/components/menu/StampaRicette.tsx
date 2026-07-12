import { useState, useRef, useMemo, type CSSProperties } from 'react'
import { X, Printer } from 'lucide-react'
import { getBisettimanaRange } from '@/modules/menu/lib/bisettimane'
import { ALLERGENI } from '@/modules/menu/constants/piatti'
import type { MenuVoce, Servizio } from '@/modules/menu/types/menuVoce'
import type { Piatto } from '@/modules/menu/types/piatto'

// ─── Types ──────────────────────────────────────────────────────────────────

interface StampaRicetteProps {
  open: boolean
  onClose: () => void
  voci: MenuVoce[]
  piatti: Piatto[]
  anno: number
  mese: number
  bisettimanaIdx: 1 | 2
}

const GIORNI_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MESI_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDayLabel(d: Date): string {
  return `${GIORNI_IT[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} ${MESI_IT[d.getMonth()]}`
}

function formatDateHeader(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/** Config degli allergeni UE presenti sul piatto (icona + numero + label). */
function allergeniDi(p: Piatto) {
  return ALLERGENI.filter(a => p[a.field as keyof Piatto])
}

/** Icona + numero dell'allergene, come mostrati nella colonna e nella legenda. */
function AllergenoBadge({ Icon, number }: { Icon: typeof ALLERGENI[number]['Icon']; number: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      <Icon size={12} strokeWidth={2} color="#333" />
      {number}
    </span>
  )
}

/**
 * Piatti del giorno/servizio in ordine di lettura per la cucina:
 * antipasti, primi, secondi (ognuno seguito dal suo contorno), dessert.
 * Deduplicati per id (es. lo stesso contorno usato da più secondi).
 */
function piattiServizio(
  voci: MenuVoce[],
  piattoMap: Map<number, Piatto>,
  giorno: number,
  servizio: Servizio,
): Piatto[] {
  const delGiorno = voci.filter(v => v.giorno === giorno && v.servizio === servizio)
  const out: Piatto[] = []
  const visti = new Set<number>()
  const push = (id: number | null) => {
    if (id == null || visti.has(id)) return
    const p = piattoMap.get(id)
    if (!p) return
    visti.add(id)
    out.push(p)
  }
  for (const tipo of ['ant', 'pr', 'se', 'des'] as const) {
    const sezione = delGiorno.filter(v => v.tipo === tipo).sort((a, b) => a.posizione - b.posizione)
    for (const v of sezione) {
      push(v.piatto_id)
      if (tipo === 'se') push(v.contorno_id)
    }
  }
  return out
}

// ─── Tabella ricette di un servizio (tutto inline: viene copiata in stampa) ──

const SI_NO_STYLE: CSSProperties = {
  fontFamily: 'system-ui, Arial, sans-serif',
  fontSize: 10,
  textAlign: 'center',
  padding: '6px 4px',
  border: '1px solid #444',
  verticalAlign: 'top',
}

function SezioneServizio({ titolo, data, righe }: { titolo: string; data: Date; righe: Piatto[] }) {
  const th: CSSProperties = {
    fontFamily: 'system-ui, Arial, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'lowercase',
    padding: '6px 4px',
    border: '1px solid #444',
    background: '#f2f2f2',
    verticalAlign: 'bottom',
  }
  const td: CSSProperties = {
    fontFamily: 'system-ui, Arial, sans-serif',
    fontSize: 11,
    padding: '6px 6px',
    border: '1px solid #444',
    verticalAlign: 'top',
  }

  return (
    <div>
      {/* header sezione */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontFamily: 'system-ui, Arial, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>
          {titolo}
        </div>
        <div style={{ fontFamily: 'system-ui, Arial, sans-serif', fontSize: 16, fontWeight: 700 }}>
          {formatDateHeader(data)}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 44, textTransform: 'none' }}>Codice</th>
            <th style={{ ...th, width: 150, textTransform: 'none', textAlign: 'left' }}>Descrizione</th>
            <th style={{ ...th, width: 34 }}>veget</th>
            <th style={{ ...th, width: 34 }}>vegan</th>
            <th style={{ ...th, width: 34 }}>no latt</th>
            <th style={{ ...th, width: 34 }}>KM0</th>
            <th style={{ ...th, width: 34 }}>tipo</th>
            <th style={{ ...th, width: 78, textTransform: 'none' }}>Allergeni</th>
            <th style={{ ...th, textTransform: 'none', textAlign: 'left' }}>Ricetta</th>
          </tr>
        </thead>
        <tbody>
          {righe.length === 0 && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center', color: '#999' }}>
                Nessun piatto pianificato
              </td>
            </tr>
          )}
          {righe.map(p => (
            <tr key={p.id} style={{ breakInside: 'avoid' }}>
              <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.id}</td>
              <td style={{ ...td, fontWeight: 700 }}>{p.nome_it}</td>
              <td style={SI_NO_STYLE}>{p.vegetariano ? 'si' : 'no'}</td>
              <td style={SI_NO_STYLE}>{p.vegano ? 'si' : 'no'}</td>
              <td style={SI_NO_STYLE}>{p.no_lattosio ? 'si' : 'no'}</td>
              <td style={SI_NO_STYLE}>{p.locale ? 'si' : 'no'}</td>
              <td style={SI_NO_STYLE}>{p.tipo ?? ''}</td>
              <td style={{ ...td, fontSize: 10 }}>
                {allergeniDi(p).length === 0 ? (
                  <span style={{ color: '#999' }}>—</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', justifyContent: 'center' }}>
                    {allergeniDi(p).map(a => (
                      <AllergenoBadge key={a.number} Icon={a.Icon} number={a.number} />
                    ))}
                  </div>
                )}
              </td>
              <td style={{ ...td, lineHeight: 1.4 }}>{p.ricetta || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* legenda allergeni per la cucina: icona + numero + nome */}
      <div style={{ fontFamily: 'system-ui, Arial, sans-serif', fontSize: 8.5, color: '#555', marginTop: 6, lineHeight: 1.6, display: 'flex', flexWrap: 'wrap', gap: '2px 10px', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>Allergeni:</span>
        {ALLERGENI.map(a => (
          <span key={a.number} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            <a.Icon size={11} strokeWidth={2} color="#555" /> {a.number} {a.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Anteprima/stampa delle ricette del giorno per la cucina: un unico PDF
 * multipagina (A4 verticale, solo italiano) con RICETTE PRANZO e RICETTE
 * CENA, incluse le colonne caratteristiche e gli allergeni per piatto.
 */
export function StampaRicette({ open, onClose, voci, piatti, anno, mese, bisettimanaIdx }: StampaRicetteProps) {
  const [giorno, setGiorno] = useState<number>(0)
  const printRef = useRef<HTMLDivElement>(null)

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
    const win = window.open('', '_blank', 'width=900,height=1000')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Ricette ${formatDateHeader(giorni[giorno])}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    @page { size: A4 portrait; margin: 10mm; }
    /* la cena inizia sempre su una pagina nuova */
    .ric-cena { page-break-before: always; break-before: page; }
    /* in stampa il foglio segue i margini di @page, non la larghezza fissa della preview */
    .ric-sheet { width: auto !important; min-height: 0 !important; padding: 0 !important; box-shadow: none !important; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    thead { display: table-header-group; }
  </style>
</head>
<body>${html}</body>
</html>`)
    win.document.close()
    setTimeout(() => { win.print() }, 400)
  }

  if (!open) return null

  const selectedDate = giorni[giorno]

  // Foglio A4 verticale a 96dpi per la preview; in stampa la larghezza
  // viene riscritta dalla regola .ric-sheet del documento di stampa.
  const sheetStyle: CSSProperties = {
    width: 794,
    minHeight: 1123,
    background: '#fff',
    boxSizing: 'border-box',
    padding: '40px 44px',
    color: '#111',
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

  const renderSheet = (servizio: Servizio) => (
    <div className={`ric-sheet ${servizio === 'cena' ? 'ric-cena' : ''}`} style={sheetStyle}>
      <SezioneServizio
        titolo={servizio === 'pranzo' ? 'RICETTE PRANZO' : 'RICETTE CENA'}
        data={selectedDate}
        righe={piattiServizio(voci, piattoMap, giorno, servizio)}
      />
    </div>
  )

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* ── Modal header ─────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <span className="font-semibold text-[15px] text-black">Anteprima stampa ricette</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black transition-colors rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal body ───────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar: day picker */}
          <div className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="flex-1 px-3 py-4 flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Settimana 1
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
                Settimana 2
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

          {/* Preview area: pranzo + cena in sequenza, come nel PDF */}
          <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6">
            <div
              style={{
                transform: 'scale(0.8)',
                transformOrigin: 'top center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              }}
            >
              <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {renderSheet('pranzo')}
                {renderSheet('cena')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
