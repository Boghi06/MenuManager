import { useEffect } from 'react'
import { StampaPreview } from './StampaPreview'
import { StampaRicette } from './StampaRicette'
import { StampaSettimana } from './StampaSettimana'
import { useMenuComposer } from '@/modules/menu/hooks/useMenuComposer'
import { useMenuFlags } from '@/modules/menu/hooks/useMenuFlags'
import { useEventi } from '@/modules/menu/hooks/useEventi'
import { usePiatti } from '@/modules/menu/hooks/usePiatti'
import type { BisettimanaCoords } from '@/modules/menu/lib/bisettimane'

export type TipoStampaOggi = 'menu' | 'ricette' | 'settimana'

interface StampaOggiProps {
  /** Coordinate della bisettimana/giorno di oggi (da findBisettimanaForDate). */
  target: BisettimanaCoords
  tipo: TipoStampaOggi
  /** Chiamata a stampa avviata (o in caso di timeout) per smontare il componente. */
  onDone: () => void
}

interface SubProps {
  target: BisettimanaCoords
  onDone: () => void
}

// ─── Stampa diretta del menù clienti di oggi (receptionist/admin) ────────────

function MenuOggi({ target, onDone }: SubProps) {
  const { anno, mese, idx, giorno } = target
  const { bisettimanaId, voci, loading: vociLoading } = useMenuComposer(anno, mese, idx)
  const { getFlag, getEvento, loading: flagsLoading } = useMenuFlags(bisettimanaId)
  const { eventi, loading: eventiLoading } = useEventi()
  const { piatti, loading: piattiLoading } = usePiatti()

  const pronto =
    bisettimanaId !== null && !vociLoading && !flagsLoading && !eventiLoading && !piattiLoading

  return (
    <StampaPreview
      open={pronto}
      onClose={onDone}
      autoPrint
      initialGiorno={giorno}
      voci={voci}
      piatti={piatti}
      anno={anno}
      mese={mese}
      bisettimanaIdx={idx}
      getFlag={getFlag}
      getEvento={getEvento}
      eventi={eventi}
    />
  )
}

// ─── Stampa diretta delle ricette di oggi (cucina/admin) ─────────────────────

function RicetteOggi({ target, onDone }: SubProps) {
  const { anno, mese, idx, giorno } = target
  const { bisettimanaId, voci, loading: vociLoading } = useMenuComposer(anno, mese, idx)
  const { piatti, loading: piattiLoading } = usePiatti()

  const pronto = bisettimanaId !== null && !vociLoading && !piattiLoading

  return (
    <StampaRicette
      open={pronto}
      onClose={onDone}
      autoPrint
      initialGiorno={giorno}
      voci={voci}
      piatti={piatti}
      anno={anno}
      mese={mese}
      bisettimanaIdx={idx}
    />
  )
}

// ─── Stampa diretta del foglio settimanale in corso (tutti i ruoli) ──────────

function SettimanaOggi({ target, onDone }: SubProps) {
  const { anno, mese, idx, giorno } = target
  const { bisettimanaId, voci, loading: vociLoading } = useMenuComposer(anno, mese, idx)
  const { piatti, loading: piattiLoading } = usePiatti()

  const pronto = bisettimanaId !== null && !vociLoading && !piattiLoading

  return (
    <StampaSettimana
      open={pronto}
      onClose={onDone}
      autoPrint
      // giorno 0–13: i primi sette sono la prima settimana della bisettimana
      initialSettimana={giorno < 7 ? 0 : 1}
      voci={voci}
      piatti={piatti}
      anno={anno}
      mese={mese}
      bisettimanaIdx={idx}
    />
  )
}

/**
 * Stampa diretta del foglio di oggi dalla schermata dei mesi: carica i dati
 * della bisettimana corrente e delega al componente di stampa in modalità
 * autoPrint (nessuna anteprima). Va montato solo dopo il click sul tasto.
 */
export function StampaOggi({ target, tipo, onDone }: StampaOggiProps) {
  // Sicurezza: se i dati non si caricano (es. bisettimana non ancora
  // inizializzata a DB), non lasciare il componente appeso all'infinito.
  useEffect(() => {
    const id = setTimeout(onDone, 12000)
    return () => clearTimeout(id)
  }, [onDone])

  if (tipo === 'ricette') return <RicetteOggi target={target} onDone={onDone} />
  if (tipo === 'settimana') return <SettimanaOggi target={target} onDone={onDone} />
  return <MenuOggi target={target} onDone={onDone} />
}
