import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { BisettimanaCard } from '@/components/menu/BisettimanaCard'
import { DuplicaSettimanaDialog } from '@/components/menu/DuplicaSettimanaDialog'
import { useBisettimane } from '@/hooks/useBisettimane'
import { MESI } from '@/constants/mesi'
import type { StatoBisettimana } from '@/hooks/useBisettimane'

export default function MenuPlanner() {
  const currentYear = new Date().getFullYear()
  const [searchParams] = useSearchParams()
  const annoParam = Number(searchParams.get('anno'))
  const [anno, setAnno] = useState(Number.isInteger(annoParam) && annoParam > 0 ? annoParam : currentYear)
  const { mappa, anniEsistenti, maxAnnoEsistente, loading, operazione, inizializzaAnno, copiaAnno, refresh, error } = useBisettimane(anno)

  const [duplicaOpen, setDuplicaOpen] = useState(false)

  const operando = operazione !== null
  const canGoBack = !loading && !operando && anniEsistenti.has(anno - 1)
  const canGoForward = !loading && !operando && maxAnnoEsistente !== null && anno < maxAnnoEsistente + 1
  const annoNonEsiste = !loading && !anniEsistenti.has(anno)
  const puoCopiareDaPrecedente = anniEsistenti.has(anno - 1)

  function getStato(mese: number, idx: 1 | 2): StatoBisettimana {
    return mappa.get(`${mese}-${idx}`)?.stato ?? 'empty'
  }

  return (
    <AppLayout showCategorie={false}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-200">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-2">
          Pianificazione menù
        </p>
        <div className="flex items-baseline gap-4">
          <h1 className="text-6xl font-light font-fraunces leading-none">{anno}</h1>
          <div className="flex items-center gap-2 ml-4">
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
            <div className="w-px h-6 bg-gray-300 mx-2" />
            {annoNonEsiste ? (
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
        </div>
      </div>

      {/* Legenda */}
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
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="px-8 py-8 text-sm text-gray-400">Caricamento…</div>
        ) : annoNonEsiste ? (
          <EmptyStateAnno
            anno={anno}
            puoCopiareDaPrecedente={puoCopiareDaPrecedente}
            operazione={operazione}
            onInizializza={() => inizializzaAnno(anno)}
            onCopia={() => copiaAnno(anno - 1, anno)}
          />
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
    </AppLayout>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  anno: number
  puoCopiareDaPrecedente: boolean
  operazione: import('@/hooks/useBisettimane').TipoOperazione
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
