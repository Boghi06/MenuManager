import { useState, useRef, useMemo, useEffect, Fragment, type CSSProperties } from 'react'
import { X, Printer } from 'lucide-react'
import { getBisettimanaRange } from '@/modules/menu/lib/bisettimane'
import { printHtmlDocument } from '@/modules/menu/lib/print'
import { CATEGORIA_BAR, secondoHaContorno } from '@/modules/menu/constants/piatti'
import { useScalaFoglio, A4_ORIZZONTALE_UTILE } from '@/modules/menu/hooks/useScalaFoglio'
import type { MenuVoce, Servizio } from '@/modules/menu/types/menuVoce'
import type { Piatto } from '@/modules/menu/types/piatto'

interface StampaSettimanaProps {
  open: boolean
  onClose: () => void
  voci: MenuVoce[]
  piatti: Piatto[]
  anno: number
  mese: number
  bisettimanaIdx: 1 | 2
  /** Settimana mostrata all'apertura (0 = prima, 1 = seconda). */
  initialSettimana?: 0 | 1
  /** Stampa diretta: nessuna anteprima, lancia la stampa appena montato. */
  autoPrint?: boolean
}

const GIORNI_IT = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']
const MESI_ABBR = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

/** "20-lug-26", come nell'intestazione del foglio Excel che questa stampa sostituisce. */
const dataBreve = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}-${MESI_ABBR[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`

const dataEstesa = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

/**
 * Colore del nome del piatto: lo stesso codice della barra a schermo
 * (rosso carne · blu pesce · verde vegetariano). Un piatto ancora senza
 * categoria si stampa in nero, come tutto il resto del foglio.
 */
const coloreNome = (p: Piatto | undefined) =>
  (p?.categoria && CATEGORIA_BAR[p.categoria]) || '#111111'

// ─── Estrazione delle voci di un giorno ──────────────────────────────────────

interface CellaPiatto {
  piatto?: Piatto
  contorno?: Piatto
}

/** Alternative di una sezione per un giorno, in ordine di posizione. */
function alternative(
  voci: MenuVoce[],
  piattoMap: Map<number, Piatto>,
  giorno: number,
  servizio: Servizio,
  tipo: 'antipasti' | 'primi' | 'secondi',
): CellaPiatto[] {
  return voci
    .filter(v => v.giorno === giorno && v.servizio === servizio && v.tipo === tipo)
    .sort((a, b) => a.posizione - b.posizione)
    .map(v => ({
      piatto: v.piatto_id != null ? piattoMap.get(v.piatto_id) : undefined,
      contorno: v.contorno_id != null ? piattoMap.get(v.contorno_id) : undefined,
    }))
}

// ─── Foglio di una settimana (stili inline: viene copiato in stampa) ─────────

const BORDO = '1px solid #7a7a7a'

const tdBase: CSSProperties = {
  border: BORDO,
  padding: '5px 6px',
  verticalAlign: 'top',
  fontFamily: 'system-ui, Arial, sans-serif',
  width: `${100 / 7}%`,
}

/**
 * Corpo del nome del piatto.
 *
 * Ogni riga della tabella prende l'altezza della cella più alta fra i sette
 * giorni: un nome lungo in un solo giorno alza la riga per tutta la settimana.
 * L'archivio della cucina arriva a 100 caratteri e in una colonna da ~122px un
 * nome così occupa 5 righe di testo. Sopra una certa lunghezza si scala il
 * corpo, così il nome sta in una riga in meno senza toccare l'impaginazione di
 * tutti gli altri piatti.
 *
 * Misurato sul catalogo reale (Chrome, geometria di questo componente, area
 * utile A4 orizzontale 733px): nel caso peggiore — i nomi più lunghi
 * dell'archivio in ogni cella — il foglio passa da 745px (che sfora) a 659px.
 * Su una settimana composta interamente di nomi lunghi gli sfori passano dal
 * 73% a zero.
 *
 * Il pavimento a 7.5px serve ai contorni, che partono già da 8: senza, i
 * quattro contorni lunghi dell'archivio scenderebbero a 6.5px, illeggibili in
 * stampa.
 *
 * NB: la lunghezza va misurata sul nome, non passata da fuori come variante —
 * `piccola` porta con sé anche il fontWeight, che è semantico (600 il secondo,
 * 400 il suo contorno) e non deve cambiare con la lunghezza.
 */
const corpoNome = (nome: string, piccola: boolean) => {
  const base = piccola ? 8 : 9.5
  const scala = nome.length > 80 ? 1.5 : nome.length > 55 ? 1 : 0
  return Math.max(7.5, base - scala)
}

/** Cella con l'id del piatto a sinistra e il nome colorato per categoria. */
function CellaVoce({ piatto, piccola = false }: { piatto?: Piatto; piccola?: boolean }) {
  if (!piatto) return <td style={tdBase} />
  return (
    <td style={tdBase}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'baseline' }}>
        <span style={{ fontSize: 6.5, color: '#8a8a8a', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>
          {piatto.id}
        </span>
        <span
          style={{
            fontSize: `calc(var(--scala, 1) * ${corpoNome(piatto.nome_it, piccola)}px)`,
            lineHeight: 1.25,
            color: coloreNome(piatto),
            fontWeight: piccola ? 400 : 600,
          }}
        >
          {piatto.nome_it}
        </span>
      </div>
    </td>
  )
}

/** Riga di asterischi: separa un blocco di secondo dal successivo. */
function RigaSeparatore({ n }: { n: number }) {
  return (
    <tr>
      {Array.from({ length: n }, (_, i) => (
        <td key={i} style={{ ...tdBase, padding: '1px 6px', textAlign: 'center', color: '#9a9a9a', fontSize: 8 }}>
          *********
        </td>
      ))}
    </tr>
  )
}

function FoglioSettimana({
  voci, piattoMap, giorni, settimana, servizio,
}: {
  voci: MenuVoce[]
  piattoMap: Map<number, Piatto>
  giorni: Date[]
  settimana: 0 | 1
  servizio: Servizio
}) {
  const colonne = Array.from({ length: 7 }, (_, c) => settimana * 7 + c)

  const perGiorno = (tipo: 'antipasti' | 'primi' | 'secondi') =>
    colonne.map(g => alternative(voci, piattoMap, g, servizio, tipo))

  const antipasti = perGiorno('antipasti')
  const primi = perGiorno('primi')
  const secondi = perGiorno('secondi')

  // Quante righe servono davvero: quelle del giorno che ne usa di più. Un
  // foglio a righe fisse sprecherebbe mezza pagina nelle settimane leggere.
  const righeDi = (celle: CellaPiatto[][], min = 1) =>
    Math.max(min, ...celle.map(c => c.length))

  const nAntipasti = righeDi(antipasti)
  const nPrimi = righeDi(primi)
  const nSecondi = righeDi(secondi)

  // Il contorno ha una riga propria solo se almeno un giorno ne ha uno in
  // quella posizione: senza questo controllo restano righe vuote a metà foglio.
  // L'ultimo secondo non ne prevede: nessuna riga, mai.
  const haContorno = (pos: number) => secondoHaContorno(pos) && secondi.some(c => c[pos]?.contorno)

  // Il corpo dei nomi si adatta al foglio: un giorno con pochi piatti li scrive
  // grandi, uno pieno resta com'era. La chiave rifà il conto quando cambia
  // servizio, settimana o composizione.
  const contenutoRef = useRef<HTMLDivElement>(null)
  const chiave = `${settimana}-${servizio}-${voci.length}-${nAntipasti}-${nPrimi}-${nSecondi}`
  useScalaFoglio(contenutoRef, A4_ORIZZONTALE_UTILE, 'pagina', chiave)

  const th: CSSProperties = {
    border: BORDO,
    padding: '4px 6px',
    fontFamily: 'system-ui, Arial, sans-serif',
    textAlign: 'left',
    background: '#f2f2f2',
    width: `${100 / 7}%`,
  }

  return (
    <div className="set-foglio" style={{ width: 1123, minHeight: 794, background: '#fff', boxSizing: 'border-box', padding: '26px 30px', color: '#111' }}>
      {/* Contenuto misurato per riempire la pagina: il wrapper esiste apposta,
          il foglio ha un minHeight che falserebbe la misura. */}
      <div ref={contenutoRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, fontFamily: 'system-ui, Arial, sans-serif' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.02em' }}>
          Menù settimanale · {settimana === 0 ? '1ª' : '2ª'} settimana · {servizio === 'pranzo' ? 'Pranzo' : 'Cena'}
        </span>
        <span style={{ fontSize: 10, color: '#555' }}>
          {dataEstesa(giorni[colonne[0]])} – {dataEstesa(giorni[colonne[6]])}
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {colonne.map((g, c) => (
              <th key={g} style={th}>
                <div style={{ fontSize: 9.5, fontWeight: 700 }}>
                  {GIORNI_IT[c]} · {settimana === 0 ? '1ª' : '2ª'} sett.
                </div>
                <div style={{ fontSize: 8, fontWeight: 400, color: '#555', marginTop: 1 }}>
                  {dataBreve(giorni[g])} · {servizio}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Antipasti, poi primi: le prime righe del foglio, come nel modello. */}
          {Array.from({ length: nAntipasti }, (_, pos) => (
            <tr key={`ant-${pos}`}>
              {antipasti.map((celle, c) => <CellaVoce key={c} piatto={celle[pos]?.piatto} />)}
            </tr>
          ))}
          {Array.from({ length: nPrimi }, (_, pos) => (
            <tr key={`pr-${pos}`}>
              {primi.map((celle, c) => <CellaVoce key={c} piatto={celle[pos]?.piatto} />)}
            </tr>
          ))}

          {/* Ogni secondo col suo contorno, i blocchi separati da asterischi. */}
          {Array.from({ length: nSecondi }, (_, pos) => (
            <Fragment key={`se-${pos}`}>
              <RigaSeparatore n={7} />
              <tr>
                {secondi.map((celle, c) => <CellaVoce key={c} piatto={celle[pos]?.piatto} />)}
              </tr>
              {haContorno(pos) && (
                <tr>
                  {secondi.map((celle, c) => <CellaVoce key={c} piatto={celle[pos]?.contorno} piccola />)}
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontFamily: 'system-ui, Arial, sans-serif', fontSize: 8, color: '#555' }}>
        {(['carne', 'pesce', 'vegetariano'] as const).map(cat => (
          <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 3, height: 9, background: CATEGORIA_BAR[cat], display: 'inline-block' }} />
            <span style={{ color: CATEGORIA_BAR[cat], fontWeight: 600, textTransform: 'capitalize' }}>{cat}</span>
          </span>
        ))}
      </div>
      </div>
    </div>
  )
}

// ─── Modale di anteprima + stampa ────────────────────────────────────────────

/**
 * Stampa settimanale del menù: un foglio A4 orizzontale per servizio, con i
 * sette giorni in colonna e, per ogni giorno, antipasto, primi e i secondi
 * ognuno col proprio contorno. Sostituisce il foglio Excel usato in cucina;
 * il nome del piatto prende il colore della sua categoria.
 *
 * A differenza della stampa menù (clienti) e delle ricette (cucina), è
 * accessibile a tutti i ruoli: è il piano di lavoro della settimana.
 */
export function StampaSettimana({
  open, onClose, voci, piatti, anno, mese, bisettimanaIdx, initialSettimana = 0, autoPrint = false,
}: StampaSettimanaProps) {
  const [settimana, setSettimana] = useState<0 | 1>(initialSettimana)
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
    const doc = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Menù settimanale ${dataEstesa(giorni[settimana * 7])}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    @page { size: A4 landscape; margin: 8mm; }
    /* la cena va su una pagina propria */
    .set-cena { page-break-before: always; break-before: page; }
    /* in stampa il foglio segue i margini di @page, non la larghezza fissa dell'anteprima */
    .set-foglio { width: auto !important; min-height: 0 !important; padding: 0 !important; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    thead { display: table-header-group; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`
    // Stampa diretta: iframe nascosto, così non apre una scheda nuova e non
    // incappa nel popup blocker (parte da un effetto, non da un click).
    if (autoPrint) { printHtmlDocument(doc); return }
    const win = window.open('', '_blank', 'width=1200,height=900')
    if (!win) return
    win.document.write(doc)
    win.document.close()
    setTimeout(() => { win.print() }, 400)
  }

  // Stampa diretta: appena i dati sono pronti stampa una volta sola e chiude.
  const autoPrintedRef = useRef(false)
  useEffect(() => {
    if (!open) { autoPrintedRef.current = false; return }
    if (!autoPrint || autoPrintedRef.current) return
    autoPrintedRef.current = true
    // breve attesa per il render della sorgente di stampa off-screen
    const id = setTimeout(() => { handlePrint(); onClose() }, 60)
    return () => clearTimeout(id)
  }, [open, autoPrint]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const foglio = (servizio: Servizio) => (
    <div className={servizio === 'cena' ? 'set-cena' : ''}>
      <FoglioSettimana
        voci={voci}
        piattoMap={piattoMap}
        giorni={giorni}
        settimana={settimana}
        servizio={servizio}
      />
    </div>
  )

  // Modalità stampa diretta: solo la sorgente off-screen, niente anteprima.
  if (autoPrint) {
    return (
      <div
        ref={printRef}
        aria-hidden
        style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {foglio('pranzo')}
        {foglio('cena')}
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '95vw', height: '95vh', background: '#f0f0f0', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <span className="font-semibold text-[15px] text-black">Anteprima stampa settimanale</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex-1 px-3 py-4 flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Settimana
              </p>
              {([0, 1] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setSettimana(w)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors
                    ${settimana === w ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {w + 1}ª · {dataEstesa(giorni[w * 7])}
                </button>
              ))}
              <p className="text-[11px] text-gray-400 mt-4 leading-snug">
                Il PDF contiene due pagine: pranzo e cena della settimana scelta.
              </p>
            </div>

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

          <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6">
            <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {foglio('pranzo')}
                {foglio('cena')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
