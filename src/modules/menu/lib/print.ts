/**
 * Stampa un documento HTML completo tramite un iframe nascosto nel documento
 * corrente. A differenza di `window.open`, l'iframe non è soggetto ai popup
 * blocker: funziona anche quando la stampa parte fuori da un gesto utente
 * diretto (es. stampa automatica del "foglio di oggi", lanciata da un effetto
 * dopo il caricamento asincrono dei dati).
 */
export function printHtmlDocument(fullHtml: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = win?.document
  if (!win || !doc) { iframe.remove(); return }

  doc.open()
  doc.write(fullHtml)
  doc.close()

  // Attende il layout (ed eventuali immagini degli eventi) prima di stampare,
  // poi rimuove l'iframe. Stessa attesa usata dal flusso window.open.
  setTimeout(() => {
    win.focus()
    win.print()
    setTimeout(() => iframe.remove(), 1000)
  }, 400)
}
