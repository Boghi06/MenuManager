const MESI_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

/** Restituisce il lunedì della settimana che contiene `date`. */
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay() // 0=dom, 1=lun, …, 6=sab
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return d
}

export interface BisettimanaRange {
  start: Date
  end: Date
}

/**
 * Calcola il range di una bisettimana.
 * - idx 1 (A): lunedì della settimana del 1° del mese → +13 giorni
 * - idx 2 (B): 14 giorni dopo startA → +13 giorni
 *
 * Es. aprile 2026: A = 30/03–12/04, B = 13/04–26/04
 * Es. maggio 2026: A = 27/04–10/05, B = 11/05–24/05
 */
export function getBisettimanaRange(anno: number, mese: number, idx: 1 | 2): BisettimanaRange {
  const startA = getMondayOf(new Date(anno, mese - 1, 1))

  const start = new Date(startA)
  if (idx === 2) start.setDate(start.getDate() + 14)

  const end = new Date(start)
  end.setDate(end.getDate() + 13)

  return { start, end }
}

/** Differenza in giorni interi tra due date, ignorando l'orario. */
function daysBetween(a: Date, b: Date): number {
  const ma = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const mb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((mb - ma) / 86400000)
}

export interface BisettimanaCoords {
  anno: number
  mese: number
  idx: 1 | 2
  giorno: number
}

/**
 * Individua la bisettimana (anno/mese/idx) e il giorno 0–13 che contiene `date`.
 * Le bisettimane di mesi consecutivi possono sfasarsi ai bordi (i mesi hanno
 * lunghezze diverse), quindi si provano in ordine: A e B del mese di `date`,
 * poi la A del mese successivo — i giorni di fine mese ricadono nella prima
 * bisettimana del mese dopo. Ritorna null se nessuna bisettimana copre la data
 * (non dovrebbe accadere per date valide).
 */
export function findBisettimanaForDate(date: Date): BisettimanaCoords | null {
  const anno = date.getFullYear()
  const mese = date.getMonth() + 1
  const candidati: Array<{ anno: number; mese: number; idx: 1 | 2 }> = [
    { anno, mese, idx: 1 },
    { anno, mese, idx: 2 },
    mese === 12 ? { anno: anno + 1, mese: 1, idx: 1 } : { anno, mese: mese + 1, idx: 1 },
  ]
  for (const c of candidati) {
    const { start } = getBisettimanaRange(c.anno, c.mese, c.idx)
    const giorno = daysBetween(start, date)
    if (giorno >= 0 && giorno <= 13) return { ...c, giorno }
  }
  return null
}

/** Formatta un range in stile "30 mar – 12 apr" o "11 – 24 mag" se stesso mese. */
export function formatBisettimanaRange({ start, end }: BisettimanaRange): string {
  const sd = start.getDate()
  const ed = end.getDate()
  const sm = MESI_SHORT[start.getMonth()]
  const em = MESI_SHORT[end.getMonth()]

  return start.getMonth() === end.getMonth()
    ? `${sd} – ${ed} ${em}`
    : `${sd} ${sm} – ${ed} ${em}`
}
