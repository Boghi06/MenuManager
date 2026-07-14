import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Printer } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { useRole } from '@/core/auth/roles'
import { BisettimanaCard } from '@/modules/menu/components/menu/BisettimanaCard'
import { DuplicaSettimanaDialog } from '@/modules/menu/components/menu/DuplicaSettimanaDialog'
import { StampaOggi, type TipoStampaOggi } from '@/modules/menu/components/menu/StampaOggi'
import { useBisettimane } from '@/modules/menu/hooks/useBisettimane'
import { findBisettimanaForDate } from '@/modules/menu/lib/bisettimane'
import { MESI } from '@/modules/menu/constants/mesi'
import type { StatoBisettimana } from '@/modules/menu/hooks/useBisettimane'

export default function MenuPlanner() {
  const currentYear = new Date().getFullYear()
  const [searchParams] = useSearchParams()
  const annoParam = Number(searchParams.get('anno'))
  const [anno, setAnno] = useState(Number.isInteger(annoParam) && annoParam > 0 ? annoParam : currentYear)
  const { mappa, anniEsistenti, maxAnnoEsistente, loading, operazione, inizializzaAnno, copiaAnno, refresh, error } = useBisettimane(anno)

  const [duplicaOpen, setDuplicaOpen] = useState(false)

  // La cucina consulta soltanto: niente inizializza/copia anno né duplica settimana
  const role = useRole()
  const readOnly = role === 'cucina'

  // Stampa diretta del foglio di oggi: individua la bisettimana corrente (a
  // prescindere dall'anno mostrato). receptionist → menù clienti, cucina →
  // ricette, admin → entrambe (due tasti).
  const targetOggi = useMemo(() => findBisettimanaForDate(new Date()), [])
  // Stampa diretta del foglio di oggi: la stampa avviene in un iframe nascosto
  // (nessuna nuova scheda/finestra), gestito da StampaOggi.
  const [stampaOggi, setStampaOggi] = useState<TipoStampaOggi | null>(null)
  const chiudiStampa = useCallback(() => setStampaOggi(null), [])
  const canStampaMenu = role !== 'cucina'
  const canStampaRicette = role !== 'receptionist'

  const operando = operazione !== null
  const canGoBack = !loading && !operando && anniEsistenti.has(anno - 1)
  const canGoForward = !loading && !operando && maxAnnoEsistente !== null && anno < maxAnnoEsistente + 1
  const annoNonEsiste = !loading && !anniEsistenti.has(anno)
  const puoCopiareDaPrecedente = anniEsistenti.has(anno - 1)

  function getStato(mese: number, idx: 1 | 2): StatoBisettimana {
    return mappa.get(`${mese}-${idx}`)?.stato ?? 'empty'
  }

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        eyebrow="Pianificazione menù"
        title={anno}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnno(a => a - 1)}
              disabled={!canGoBack}
              className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm transition-colors
                         enabled:hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              ← {anno - 1}
            </button>
            <button
              onClick={() => setAnno(a => a + 1)}
              disabled={!canGoForward}
              className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm transition-colors
                         enabled:hover:bg-gray-50 disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {anno + 1} →
            </button>
            {!readOnly && <div className="w-px h-6 bg-gray-300 mx-2" />}
            {readOnly ? null : annoNonEsiste ? (
              <>
                <button
                  onClick={() => inizializzaAnno(anno)}
                  disabled={operando}
                  className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm transition-colors
                             enabled:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {operazione === 'inizializza' ? 'Inizializzazione…' : 'Inizializza vuoto'}
                </button>
                <button
                  onClick={() => copiaAnno(anno - 1, anno)}
                  disabled={operando || !puoCopiareDaPrecedente}
                  className="h-9 px-3 border border-gray-900 rounded-md bg-gray-900 text-white text-sm transition-colors
                             enabled:hover:bg-black disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {operazione === 'copia' ? 'Copia in corso…' : `Copia da ${anno - 1}`}
                </button>
              </>
            ) : (
              <button
                onClick={() => setDuplicaOpen(true)}
                className="h-9 px-3 inline-flex items-center gap-1.5 border border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Duplica settimana
              </button>
            )}
          </div>
        }
      />

      {/* Legenda + stampa diretta del foglio di oggi (a destra) */}
      <div className="px-8 py-4 flex gap-5 items-center text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-black" />
          Compilata
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gray-400" />
          Parziale
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white border border-gray-300" />
          Vuota
        </div>

        <div className="ml-auto flex items-center gap-2">
          {canStampaMenu && (
            <button
              onClick={() => setStampaOggi('menu')}
              disabled={targetOggi === null || stampaOggi !== null}
              className="h-8 px-3 inline-flex items-center gap-1.5 border border-gray-900 rounded-md bg-gray-900 text-white text-xs transition-colors
                         enabled:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              {stampaOggi === 'menu' ? 'Preparazione…' : 'Menù di oggi'}
            </button>
          )}
          {canStampaRicette && (
            <button
              onClick={() => setStampaOggi('ricette')}
              disabled={targetOggi === null || stampaOggi !== null}
              className="h-8 px-3 inline-flex items-center gap-1.5 border border-gray-900 rounded-md bg-gray-900 text-white text-xs transition-colors
                         enabled:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              {stampaOggi === 'ricette' ? 'Preparazione…' : 'Ricette di oggi'}
            </button>
          )}
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="px-8 py-8 text-sm text-gray-400">Caricamento…</div>
        ) : annoNonEsiste ? (
          readOnly ? (
            <div className="px-8 py-12 text-center text-sm text-gray-500">
              L'anno <span className="font-semibold text-black">{anno}</span> non è ancora stato inizializzato.
            </div>
          ) : (
            <EmptyStateAnno
              anno={anno}
              puoCopiareDaPrecedente={puoCopiareDaPrecedente}
              operazione={operazione}
              onInizializza={() => inizializzaAnno(anno)}
              onCopia={() => copiaAnno(anno - 1, anno)}
            />
          )
        ) : (
          <>
            {error && (
              <div className="mx-8 mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="px-8 py-8 grid grid-cols-4 gap-5">
              {MESI.map((nomeMese, i) => {
                const mese = i + 1
                return (
                  <div key={mese} className="border border-gray-200 p-5 bg-white">
                    <h2 className="font-fraunces text-2xl font-normal text-black mb-4">{nomeMese}</h2>
                    <BisettimanaCard
                      anno={anno}
                      mese={mese}
                      idx={1}
                      stato={getStato(mese, 1)}
                    />
                    <BisettimanaCard
                      anno={anno}
                      mese={mese}
                      idx={2}
                      stato={getStato(mese, 2)}
                      className="mt-2"
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <DuplicaSettimanaDialog
        open={duplicaOpen}
        onClose={() => setDuplicaOpen(false)}
        annoCorrente={anno}
        anniDisponibili={[...anniEsistenti].sort((a, b) => b - a)}
        onDone={refresh}
      />

      {stampaOggi && targetOggi && (
        <StampaOggi target={targetOggi} tipo={stampaOggi} onDone={chiudiStampa} />
      )}
    </AppLayout>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  anno: number
  puoCopiareDaPrecedente: boolean
  operazione: import('@/modules/menu/hooks/useBisettimane').TipoOperazione
  onInizializza: () => void
  onCopia: () => void
}

function EmptyStateAnno({ anno, puoCopiareDaPrecedente, operazione, onInizializza, onCopia }: EmptyStateProps) {
  const operando = operazione !== null

  return (
    <div className="px-8 py-12 flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-sm text-gray-500">
          L'anno <span className="font-semibold text-black">{anno}</span> non è ancora stato inizializzato.
        </p>
        <p className="text-xs text-gray-400 mt-1">Scegli come vuoi procedere.</p>
      </div>

      <div className="flex gap-4 w-full max-w-xl">
        {/* Opzione: vuoto */}
        <div className="flex-1 border border-gray-200 p-6 bg-white flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-black mb-1">Inizializza vuoto</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Crea le 24 bisettimane dell'anno {anno} senza contenuto.
            </p>
          </div>
          <button
            onClick={onInizializza}
            disabled={operando}
            className="h-9 w-full border border-gray-300 rounded-md bg-white text-sm transition-colors
                       enabled:hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {operazione === 'inizializza' ? 'Inizializzazione…' : 'Inizializza vuoto'}
          </button>
        </div>

        {/* Opzione: copia */}
        <div className={`flex-1 border p-6 flex flex-col gap-4 ${puoCopiareDaPrecedente ? 'border-gray-900 bg-white' : 'border-gray-200 bg-gray-50'}`}>
          <div>
            <p className={`text-sm font-medium mb-1 ${puoCopiareDaPrecedente ? 'text-black' : 'text-gray-400'}`}>
              Copia da {anno - 1}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {puoCopiareDaPrecedente
                ? `Importa la struttura dell'anno ${anno - 1} come base per ${anno}.`
                : `L'anno ${anno - 1} non esiste. Inizializza prima quell'anno.`}
            </p>
          </div>
          <button
            onClick={onCopia}
            disabled={operando || !puoCopiareDaPrecedente}
            className="h-9 w-full border border-gray-900 rounded-md bg-gray-900 text-white text-sm transition-colors
                       enabled:hover:bg-black disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {operazione === 'copia' ? 'Copia in corso…' : `Copia da ${anno - 1}`}
          </button>
        </div>
      </div>
    </div>
  )
}
