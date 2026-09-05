import { useLayoutEffect, type RefObject } from 'react'

/** Altezza utile di una pagina A4 a 96dpi, al netto dei margini di @page. */
export const A4_ORIZZONTALE_UTILE = 733   // 210mm − 16mm di margine
export const A4_VERTICALE_UTILE = 1047    // 297mm − 20mm di margine

/** Giri di bisezione: 8 bastano a stare entro l'1% del massimo. */
const GIRI = 8

/** Scala massima: oltre, un foglio quasi vuoto diventerebbe un poster. */
const SCALA_MAX = 2.5

/**
 * Margini di sicurezza fra l'altezza misurata e quella davvero disponibile.
 *
 * Su una pagina sola il divario è piccolo (anteprima e stampa hanno la stessa
 * larghezza utile), ma sforare vorrebbe dire un foglio settimanale su due
 * pagine: 2% di margine costa poco e lo esclude.
 *
 * Su un documento di più pagine il divario è più grosso: l'altezza del
 * contenuto non tiene conto dei salti pagina, e una riga indivisibile che non
 * ci sta più passa intera alla pagina dopo, lasciando un vuoto che la misura
 * non vede.
 */
const SICUREZZA_PAGINA = 0.98
const SICUREZZA_DOCUMENTO = 0.92

/**
 * Ingrandisce i font di un foglio di stampa finché il contenuto riempie la
 * pagina, senza sforarla. Non restituisce niente: scrive la variabile CSS
 * `--scala` sull'elemento, e i font del foglio la usano dentro un `calc()`.
 *
 * Perché misurare invece di alzare il corpo una volta per tutte: la lunghezza
 * dei nomi e delle ricette cambia da un giorno all'altro, quindi un corpo fisso
 * o lascia mezza pagina bianca nei giorni scarichi o sfora in quelli pieni.
 *
 * Perché toccare il DOM invece di passare da uno stato React: la ricerca è un
 * ciclo misura → cambia → rimisura, e il testo va a capo, quindi l'altezza non
 * è proporzionale al corpo e una formula non basterebbe. Con lo stato sarebbero
 * otto render in cascata a ogni apertura — che è poi ciò che il React Compiler
 * vieta. Qui i giri avvengono tutti dentro un solo effetto, prima del paint.
 *
 * Misura in anteprima ciò che finirà in stampa: l'anteprima dei due fogli è
 * larga quanto la pagina stampata al netto dei margini (il padding del foglio
 * fa le veci dei margini di @page), quindi il testo va a capo negli stessi
 * punti. La variabile resta inline sull'elemento, e finisce nell'HTML copiato
 * nel documento di stampa.
 *
 * @param ref     contenuto da misurare. Non deve avere un minHeight: falserebbe
 *                la misura del foglio quasi vuoto, cioè proprio il caso da
 *                ingrandire.
 * @param altezzaPagina  altezza utile di una pagina (A4_*_UTILE)
 * @param modo    'pagina' per un foglio che sta in una pagina sola;
 *                'documento' per uno che ne occupa già più d'una, dove il
 *                limite è non aggiungerne un'altra.
 * @param chiave  cambia quando cambiano i dati: fa rifare la ricerca.
 */
export function useScalaFoglio(
  ref: RefObject<HTMLElement | null>,
  altezzaPagina: number,
  modo: 'pagina' | 'documento',
  chiave: string,
) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const misura = (scala: number) => {
      el.style.setProperty('--scala', String(scala))
      return el.offsetHeight
    }

    const base = misura(1)
    if (base === 0) return
    const target = modo === 'pagina'
      ? altezzaPagina * SICUREZZA_PAGINA
      : Math.ceil(base / altezzaPagina) * altezzaPagina * SICUREZZA_DOCUMENTO

    // Bisezione: `lo` è sempre una scala che ci sta, `hi` una che sfora.
    let lo = 1
    let hi = SCALA_MAX
    for (let giro = 0; giro < GIRI; giro++) {
      const prova = (lo + hi) / 2
      if (misura(prova) <= target) lo = prova
      else hi = prova
    }
    misura(lo)
  }, [ref, altezzaPagina, modo, chiave])
}
