import { useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { useRole } from '@/core/auth/roles'
import { MenuComposerGrid } from '@/modules/menu/components/menu/MenuComposerGrid'
import { SelettorePiatto } from '@/modules/menu/components/menu/SelettorePiatto'
import { LegendaCategorie } from '@/modules/menu/components/piatti/LegendaCategorie'
import { StampaPreview } from '@/modules/menu/components/menu/StampaPreview'
import { StampaRicette } from '@/modules/menu/components/menu/StampaRicette'
import { StampaSettimana } from '@/modules/menu/components/menu/StampaSettimana'
import { useMenuComposer } from '@/modules/menu/hooks/useMenuComposer'
import { useMenuFlags } from '@/modules/menu/hooks/useMenuFlags'
import { usePiatti } from '@/modules/menu/hooks/usePiatti'
import { useEventi } from '@/modules/menu/hooks/useEventi'
import { getBisettimanaRange, formatBisettimanaRange } from '@/modules/menu/lib/bisettimane'
import { MESI } from '@/modules/menu/constants/mesi'
import type { FlagKey, Servizio, SezioneTipo } from '@/modules/menu/types/menuVoce'
import type { Piatto } from '@/modules/menu/types/piatto'

const GIORNI_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

type SelectorTarget =
  | { kind: 'sezione'; giorno: number; tipo: SezioneTipo }
  | { kind: 'contorno'; secondoVoceId: number }

export default function MenuComposer() {
  const navigate = useNavigate()
  const { anno: annoP, mese: meseP, bisett: bisettP } = useParams()
  const anno = Number(annoP)
  const mese = Number(meseP)
  const idx = (Number(bisettP) === 2 ? 2 : 1) as 1 | 2

  const [settimana, setSettimana] = useState<0 | 1>(0)
  const [servizio, setServizio] = useState<Servizio>('pranzo')
  const [target, setTarget] = useState<SelectorTarget | null>(null)
  const [stampaOpen, setStampaOpen] = useState(false)
  const [ricetteOpen, setRicetteOpen] = useState(false)
  const [settimanaOpen, setSettimanaOpen] = useState(false)

  // cucina: compone il menù e stampa le ricette · receptionist: consulta e
  // stampa il menù clienti · admin: modifica + entrambe le stampe
  const role = useRole()
  const readOnly = role === 'receptionist'

  const { bisettimanaId, voci, loading, error, aggiungiPiatto, setContorno, rimuoviPiatto } =
    useMenuComposer(anno, mese, idx)
  const { piatti } = usePiatti()
  const { getFlag, toggleFlag, getEvento, setEvento } = useMenuFlags(bisettimanaId)
  const { eventi } = useEventi()

  // Una sola mappa id→piatto: la griglia ne legge nome e categoria (che colora
  // la barra dello slot) senza rifiltrare l'elenco piatti per ogni cella.
  const piattoById = useMemo(() => {
    const m = new Map<number, Piatto>()
    for (const p of piatti) m.set(p.id, p)
    return m
  }, [piatti])
  const nomePiatto = (id: number | null) => (id != null ? piattoById.get(id)?.nome_it ?? `#${id}` : '')
  const categoriaPiatto = (id: number | null) => (id != null ? piattoById.get(id)?.categoria ?? null : null)

  const range = getBisettimanaRange(anno, mese, idx)
  const giorniLabels = useMemo(() => {
    return GIORNI_SHORT.map((g, c) => {
      const d = new Date(range.start)
      d.setDate(d.getDate() + settimana * 7 + c)
      return `${g} ${d.getDate()}`
    })
  }, [range.start, settimana])

  const filtroTipo = target?.kind === 'contorno' ? 'contorni' : target?.tipo ?? 'primi'

  const handlePick = useCallback((piattoId: number) => {
    if (!target) return
    if (target.kind === 'sezione') {
      void aggiungiPiatto(target.giorno, servizio, target.tipo, piattoId)
    } else {
      void setContorno(target.secondoVoceId, piattoId)
    }
  }, [target, servizio, aggiungiPiatto, setContorno])

  const bottoneStampa = 'h-9 px-3 border border-gray-900 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors'

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        back={{ label: 'Tutti i mesi', onClick: () => navigate(`/menu?anno=${anno}`) }}
        eyebrow="Composizione menù"
        title={`${MESI[mese - 1]} ${anno} · Bisettimana ${idx === 1 ? 'A' : 'B'}`}
        subtitle={formatBisettimanaRange(range)}
      >
        {/* Una riga sola sotto il titolo: a sinistra cosa mostra la griglia,
            a destra le stampe. In `actions` finivano all'altezza del titolo,
            staccate dai toggle che comandano la stessa vista. */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {/* Toggle settimana 1/2 */}
          <div className="flex h-9 border border-gray-300 rounded-md overflow-hidden">
            {([0, 1] as const).map(w => (
              <button
                key={w}
                onClick={() => setSettimana(w)}
                className={`px-3.5 text-sm transition-colors ${w === 1 ? 'border-l border-gray-300' : ''}
                            ${settimana === w ? 'bg-gray-900 text-white' : 'bg-white text-black hover:bg-gray-50'}`}
              >
                Sett. {w + 1}
              </button>
            ))}
          </div>

          {/* Toggle pranzo/cena */}
          <div className="flex h-9 border border-gray-300 rounded-md overflow-hidden">
            {(['pranzo', 'cena'] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setServizio(s)}
                className={`px-3.5 text-sm capitalize transition-colors ${i === 1 ? 'border-l border-gray-300' : ''}
                            ${servizio === s ? 'bg-gray-900 text-white' : 'bg-white text-black hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* La settimanale è il piano di lavoro: la vedono tutti i ruoli. */}
            <button
              onClick={() => setSettimanaOpen(true)}
              className={bottoneStampa}
            >
              Stampa settimana
            </button>
            {role !== 'cucina' && (
              <button
                onClick={() => setStampaOpen(true)}
                className={bottoneStampa}
              >
                Stampa menù
              </button>
            )}
            {role !== 'receptionist' && (
              <button
                onClick={() => setRicetteOpen(true)}
                className={bottoneStampa}
              >
                Stampa ricette
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Body */}
      <div className="flex-1 overflow-auto p-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {/* leggenda del colore della barra a sinistra di ogni piatto */}
        <LegendaCategorie className="mb-3 justify-end" />
        {loading ? (
          <div className="text-sm text-gray-400">Caricamento…</div>
        ) : (
          <MenuComposerGrid
            voci={voci}
            settimana={settimana}
            servizio={servizio}
            giorniLabels={giorniLabels}
            nomePiatto={nomePiatto}
            categoriaPiatto={categoriaPiatto}
            readOnly={readOnly}
            onAdd={(giorno, tipo) => setTarget({ kind: 'sezione', giorno, tipo })}
            onRemove={(voceId) => void rimuoviPiatto(voceId)}
            onAddContorno={(secondoVoceId) => setTarget({ kind: 'contorno', secondoVoceId })}
            onRemoveContorno={(secondoVoceId) => void setContorno(secondoVoceId, null)}
            getFlag={(giorno, key) => getFlag(giorno, servizio, key)}
            onToggleFlag={(giorno, key: FlagKey) => void toggleFlag(giorno, servizio, key)}
            getEventoId={(giorno) => getEvento(giorno, servizio)}
            onSetEventoId={(giorno, id) => void setEvento(giorno, servizio, id)}
            eventi={eventi}
            // la scheda del piatto vive nell'elenco piatti: ci si arriva con
            // ?piatto=<id>, che là apre il drawer in sola lettura
            onOpenPiatto={(piattoId) => navigate(`/piatti?piatto=${piattoId}`)}
          />
        )}
      </div>

      <SelettorePiatto
        open={target !== null}
        onOpenChange={(o) => { if (!o) setTarget(null) }}
        filtroTipo={filtroTipo}
        onPick={handlePick}
      />

      <StampaSettimana
        open={settimanaOpen}
        onClose={() => setSettimanaOpen(false)}
        voci={voci}
        piatti={piatti}
        anno={anno}
        mese={mese}
        bisettimanaIdx={idx}
        initialSettimana={settimana}
      />

      {role !== 'cucina' && (
        <StampaPreview
          open={stampaOpen}
          onClose={() => setStampaOpen(false)}
          voci={voci}
          piatti={piatti}
          anno={anno}
          mese={mese}
          bisettimanaIdx={idx}
          getFlag={getFlag}
          getEvento={getEvento}
          eventi={eventi}
        />
      )}

      {role !== 'receptionist' && (
        <StampaRicette
          open={ricetteOpen}
          onClose={() => setRicetteOpen(false)}
          voci={voci}
          piatti={piatti}
          anno={anno}
          mese={mese}
          bisettimanaIdx={idx}
        />
      )}
    </AppLayout>
  )
}
