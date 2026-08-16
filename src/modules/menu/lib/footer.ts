/** Formatta un prezzo come "7,00" — virgola decimale, due cifre, identico in ogni lingua. */
export function formatPrezzo(n: number): string {
  return (Number.isFinite(n) ? n : 0).toFixed(2).replace('.', ',')
}

/** Converte l'input prezzo dell'editor ("7,00" o "7.00") in numero. */
export function parsePrezzo(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Etichetta "Con supplemento:" per lingua (il prefisso lo formatta l'app). */
export const SUPPL_PREFIX: Record<string, string> = {
  it: 'Con supplemento:',
  en: 'With supplement:',
  de: 'Mit Aufpreis:',
  fr: 'Avec supplément :',
}

// L'elenco dei piatti "sempre a vostra scelta" non si impagina più qui: sta su
// una riga sola accanto alla sua etichetta e lo manda a capo il browser, un
// nome intero alla volta. Vedi components/menu/ElencoInline.tsx.
