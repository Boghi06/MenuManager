import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { RefreshCw, Search, Info, X } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { Input } from '@/core/ui/input'
import { useActivityLog, AUDIT_PAGE_SIZE } from '@/modules/menu/hooks/useActivityLog'
import { useAuditLookups } from '@/modules/menu/hooks/useAuditLookups'
import { AuditRow } from '@/modules/menu/components/audit/AuditRow'
import {
  descriviRiga, displayUser, tableLabel, labelGiornata, chiaveGiornata,
  campiDellaRiga, actionMeta, AUDIT_GRID, TABELLE_TRACCIATE,
} from '@/modules/menu/lib/audit'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

// ─── Filtro periodo ──────────────────────────────────────────────────────────

const PERIODI = [
  { value: 'all', label: 'Sempre', giorni: 0 },
  { value: '1', label: 'Oggi', giorni: 1 },
  { value: '7', label: 'Ultimi 7 giorni', giorni: 7 },
  { value: '30', label: 'Ultimi 30 giorni', giorni: 30 },
] as const

/** Istante da cui contare il periodo scelto (mezzanotte di N-1 giorni fa). */
function inizioPeriodo(giorni: number): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (giorni - 1))
  return d.getTime()
}

// ─── Pannello "come funziona" ────────────────────────────────────────────────

function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{titolo}</div>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

function ComeFunziona({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-8 mt-6 mb-2 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <p className="text-sm text-gray-600 max-w-3xl">
          Il registro è scritto dal database stesso: ogni volta che qualcuno salva un piatto o
          compone un menù, l’operazione viene annotata qui nell’istante in cui avviene, con lo stato
          del dato <em>prima</em> e <em>dopo</em>. Apri una riga per vedere i campi cambiati uno per uno.
        </p>
        <button onClick={onClose} title="Chiudi" className="shrink-0 p-1 rounded text-gray-500 hover:text-black hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 px-5 py-4">
        <Sezione titolo="Cosa viene registrato">
          Creazione, modifica ed eliminazione di <strong>piatti</strong> del catalogo e di{' '}
          <strong>voci di menù</strong> (il piatto messo in un giorno, servizio e posizione di una bisettimana,
          contorno compreso).
        </Sezione>
        <Sezione titolo="Cosa non viene registrato">
          Le voci mostrate/nascoste nel menù (succhi, insalate, formaggi, buffet di dessert), gli eventi,
          il footer, gli utenti e i ruoli, le stampe e gli accessi: non hanno un tracciamento a database.
        </Sezione>
        <Sezione titolo="Chi compare come autore">
          Il nome dell’utente che ha eseguito l’operazione dall’app. <strong>Sistema</strong> indica un’operazione
          senza utente collegato: importazioni, migrazioni o interventi fatti direttamente sul database.
        </Sezione>
        <Sezione titolo="Attendibilità">
          Le righe sono scritte dal database e non sono modificabili né cancellabili dall’applicazione.
          Il registro è visibile ai soli amministratori.
        </Sezione>
        <Sezione titolo="Come leggere una modifica">
          In riga trovi i nomi dei campi toccati. Aprendola vedi il confronto{' '}
          <span className="px-1 rounded bg-red-50 text-red-900/80 line-through decoration-red-300">valore precedente</span>{' '}
          →{' '}
          <span className="px-1 rounded bg-green-50 text-green-900">valore nuovo</span>, un campo per riga.
        </Sezione>
        <Sezione titolo="Filtri e caricamento">
          Il registro si carica a blocchi di {AUDIT_PAGE_SIZE} attività, dalla più recente. Ricerca e filtri
          lavorano sulle righe già caricate: per cercare più indietro nel tempo usa «Carica altri».
        </Sezione>
      </div>
    </div>
  )
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function Auditing() {
  const { righe, loading, error, hasMore, loadMore, refresh } = useActivityLog()
  const ctx = useAuditLookups(righe)

  const [filtroAzione, setFiltroAzione] = useState('all')
  const [filtroTabella, setFiltroTabella] = useState('all')
  const [filtroUtente, setFiltroUtente] = useState('all')
  const [filtroPeriodo, setFiltroPeriodo] = useState('all')
  const [search, setSearch] = useState('')

  const [aiuto, setAiuto] = useState(false)

  // Entità: sempre le due tracciate dai trigger, più eventuali tabelle
  // comparse nel log (un trigger aggiunto in futuro non deve sparire dal filtro).
  const tabelle = useMemo(
    () => [...new Set([...TABELLE_TRACCIATE, ...righe.map(r => r.table_name)])],
    [righe],
  )
  const utenti = useMemo(
    () => [...new Set(righe.map(r => displayUser(r.user_email)))].sort((a, b) => a.localeCompare(b, 'it')),
    [righe],
  )

  // Testo su cui cerca la barra di ricerca: nome del piatto, contesto (giorno,
  // servizio, portata), utente, id e campi toccati — cioè tutto ciò che la riga
  // mostra, così quello che si legge è anche ciò che si può cercare.
  const testoRicerca = useMemo(() => {
    const map = new Map<number, string>()
    for (const r of righe) {
      const { titolo, contesto } = descriviRiga(r, ctx)
      const campi = campiDellaRiga(r, ctx).map(c => c.label).join(' ')
      map.set(r.id, [
        titolo, contesto, campi, displayUser(r.user_email),
        tableLabel(r.table_name), r.record_id ?? '', actionMeta(r.action).label,
      ].join(' ').toLowerCase())
    }
    return map
  }, [righe, ctx])

  const filtrate = useMemo(() => {
    const q = search.trim().toLowerCase()
    const periodo = PERIODI.find(p => p.value === filtroPeriodo)
    const da = periodo && periodo.giorni > 0 ? inizioPeriodo(periodo.giorni) : null
    return righe.filter(r =>
      (filtroAzione === 'all' || r.action === filtroAzione) &&
      (filtroTabella === 'all' || r.table_name === filtroTabella) &&
      (filtroUtente === 'all' || displayUser(r.user_email) === filtroUtente) &&
      (da === null || new Date(r.created_at).getTime() >= da) &&
      (q === '' || (testoRicerca.get(r.id) ?? '').includes(q)),
    )
  }, [righe, filtroAzione, filtroTabella, filtroUtente, filtroPeriodo, search, testoRicerca])

  // conteggi per tipo di azione sulle righe filtrate
  const conteggi = useMemo(() => {
    const c = { CREATE: 0, UPDATE: 0, DELETE: 0 } as Record<string, number>
    for (const r of filtrate) c[r.action] = (c[r.action] ?? 0) + 1
    return c
  }, [filtrate])

  // raggruppamento per giornata: le righe arrivano già in ordine decrescente
  const giornate = useMemo(() => {
    const out: Array<{ chiave: string; label: string; righe: ActivityLog[] }> = []
    for (const r of filtrate) {
      const chiave = chiaveGiornata(r.created_at)
      if (out.length === 0 || out[out.length - 1].chiave !== chiave) {
        out.push({ chiave, label: labelGiornata(r.created_at), righe: [r] })
      } else {
        out[out.length - 1].righe.push(r)
      }
    }
    return out
  }, [filtrate])

  const filtriAttivi =
    filtroAzione !== 'all' || filtroTabella !== 'all' || filtroUtente !== 'all' ||
    filtroPeriodo !== 'all' || search.trim() !== ''

  const azzeraFiltri = () => {
    setFiltroAzione('all'); setFiltroTabella('all'); setFiltroUtente('all')
    setFiltroPeriodo('all'); setSearch('')
  }

  const selectClass = 'h-9 px-3 border border-gray-300 rounded-md bg-white text-sm'

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Amministrazione"
        title="Registro attività"
        subtitle="Chi ha cambiato cosa, e cosa esattamente è cambiato, su piatti e menù."
        actions={
          <>
            <button
              onClick={() => setAiuto(v => !v)}
              className={`h-9 px-3 inline-flex items-center gap-1.5 border rounded-md text-sm transition-colors
                          ${aiuto ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
            >
              <Info className="w-4 h-4" />
              Come funziona
            </button>
            <button
              onClick={refresh}
              title="Ricarica il registro"
              className="h-9 px-3 inline-flex items-center gap-1.5 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </>
        }
      >
        <div className="flex items-center gap-2 flex-wrap mt-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cerca piatto, giorno, utente, campo…"
              className="pl-9 h-9 text-sm bg-white border-gray-300 rounded-md"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filtroTabella} onChange={e => setFiltroTabella(e.target.value)} className={selectClass}>
            <option value="all">Tutte le entità</option>
            {tabelle.map(t => <option key={t} value={t}>{tableLabel(t)}</option>)}
          </select>
          <select value={filtroAzione} onChange={e => setFiltroAzione(e.target.value)} className={selectClass}>
            <option value="all">Tutte le azioni</option>
            <option value="CREATE">Creazioni</option>
            <option value="UPDATE">Modifiche</option>
            <option value="DELETE">Eliminazioni</option>
          </select>
          <select value={filtroUtente} onChange={e => setFiltroUtente(e.target.value)} className={selectClass}>
            <option value="all">Tutti gli utenti</option>
            {utenti.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className={selectClass}>
            {PERIODI.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {filtriAttivi && (
            <button onClick={azzeraFiltri} className="h-9 px-3 text-sm text-gray-500 hover:text-black transition-colors">
              Azzera filtri
            </button>
          )}
        </div>

        {/* Riepilogo: quante righe si stanno guardando e su quante caricate.
            Serve a non scambiare "non ci sono attività" per "non sono ancora
            state caricate": i filtri vedono solo il blocco già scaricato. */}
        <div className="flex items-center gap-3 flex-wrap mt-3 text-xs text-gray-500">
          <span>
            <strong className="text-gray-700">{filtrate.length.toLocaleString('it-IT')}</strong>
            {filtrate.length !== righe.length && ` di ${righe.length.toLocaleString('it-IT')}`} attività
            {hasMore && ' caricate finora'}
          </span>
          {(['CREATE', 'UPDATE', 'DELETE'] as const).map(a => {
            const meta = actionMeta(a)
            return conteggi[a] > 0 ? (
              <span key={a} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${meta.badge}`}>
                <meta.Icon className="w-3 h-3" />
                {conteggi[a]} {meta.label.toLowerCase()}
              </span>
            ) : null
          })}
        </div>
      </PageHeader>

      {aiuto && <ComeFunziona onClose={() => setAiuto(false)} />}

      {/* Colonne */}
      <div className={`${AUDIT_GRID} px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50 shrink-0`}>
        <span />
        <span>Ora</span>
        <span>Utente</span>
        <span>Azione</span>
        <span>Oggetto</span>
        <span>Cosa è cambiato</span>
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-8 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && righe.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Caricamento…</div>
        )}
        {!loading && !error && filtrate.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 h-40 text-sm text-gray-400">
            {righe.length === 0
              ? 'Nessuna attività registrata.'
              : 'Nessuna attività corrisponde ai filtri tra quelle caricate.'}
            {filtriAttivi && (
              <button onClick={azzeraFiltri} className="text-gray-600 underline underline-offset-2 hover:text-black transition-colors">
                Azzera i filtri
              </button>
            )}
          </div>
        )}

        {giornate.map(g => (
          <div key={g.chiave}>
            <div className="sticky top-0 z-10 px-8 py-1.5 bg-brand-canvas/95 backdrop-blur-sm border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {g.label}
              <span className="ml-2 font-normal normal-case text-gray-400">{g.righe.length} attività</span>
            </div>
            {g.righe.map(r => <AuditRow key={r.id} riga={r} ctx={ctx} />)}
          </div>
        ))}

        {hasMore && (
          <div className="p-6 flex flex-col items-center gap-2">
            <button
              onClick={loadMore}
              disabled={loading}
              className="h-9 px-4 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Caricamento…' : 'Carica altri'}
            </button>
            {filtriAttivi && (
              <span className="text-xs text-gray-400">
                I filtri si applicano alle attività già caricate: carica altro per cercare più indietro.
              </span>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
