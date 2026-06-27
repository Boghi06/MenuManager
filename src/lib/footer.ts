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

/** Impagina un elenco di nomi piatto su più righe stampate, senza superare maxChars a riga. */
export function wrapPiatti(nomi: string[], maxChars = 90): string[] {
  const righe: string[] = []
  let corrente = ''
  for (const nome of nomi) {
    if (corrente === '') {
      corrente = nome
    } else if ((corrente + ', ' + nome).length <= maxChars) {
      corrente += ', ' + nome
    } else {
      righe.push(corrente)
      corrente = nome
    }
  }
  if (corrente !== '') righe.push(corrente)
  return righe
}
