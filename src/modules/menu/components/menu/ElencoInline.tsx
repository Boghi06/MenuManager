import { Fragment } from 'react'

interface ElencoInlineProps {
  /** Un elemento per nome piatto: la virgola la mette il componente. */
  voci: string[]
}

/**
 * Elenco di nomi separati da virgola, su una riga sola che va a capo da sola
 * quando serve.
 *
 * Ogni nome sta in uno span `nowrap` e si porta dietro la propria virgola:
 * così l'a capo può cadere solo NEGLI SPAZI FRA un piatto e l'altro, mai
 * dentro un nome ("Escaloppe di ⏎ maiale alla griglia"). Lo spazio che separa
 * gli span resta fuori da `nowrap`, ed è l'unico punto in cui il browser può
 * spezzare la riga; la virgola dentro lo span evita che una riga cominci con
 * un segno di punteggiatura.
 */
export function ElencoInline({ voci }: ElencoInlineProps) {
  return (
    <>
      {voci.map((voce, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span style={{ whiteSpace: 'nowrap' }}>
            {voce}{i < voci.length - 1 && ','}
          </span>
        </Fragment>
      ))}
    </>
  )
}
