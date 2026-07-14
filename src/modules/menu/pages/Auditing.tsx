import { useState, useMemo } from 'react'
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { useActivityLog } from '@/modules/menu/hooks/useActivityLog'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

// ─── Etichette e stile per tabella/azione ───────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  piatti: 'Piatto',
  menu_voci: 'Voce di menù',
}

function tableLabel(name: string): string {
  return TABLE_LABELS[name] ?? name
}

const ACTION_META: Record<string, { label: string; badge: string; Icon: typeof Plus }> = {
  CREATE: { label: 'Creazione', badge: 'bg-green-100 text-green-800 border-green-200', Icon: Plus },
  UPDATE: { label: 'Modifica',  badge: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Pencil },
  DELETE: { label: 'Eliminazione', badge: 'bg-red-100 text-red-700 border-red-200', Icon: Trash2 },
}

function actionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, badge: 'bg-gray-100 text-gray-700 border-gray-200', Icon: Pencil }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Nome utente ricavato dall'email sintetica <nome>@utenti.local (o email vera). */
function displayUser(email: string | null): string {
  if (!email) return 'Sistema'
  return email.endsWith('@utenti.local') ? email.slice(0, -'@utenti.local'.length) : email
}

/** Riga di sintesi: pochi campi identificativi dallo snapshot. */
function riepilogo(data: Record<string, unknown> | null): string {
  if (!data) return ''
  if (typeof data.nome_it === 'string' && data.nome_it) return data.nome_it
  const parti: string[] = []
  if (data.giorno !== undefined) parti.push(`giorno ${data.giorno}`)
  if (data.servizio) parti.push(String(data.servizio))
  if (data.tipo) parti.push(String(data.tipo))
  return parti.join(' · ')
}

// ─── Riga del registro ───────────────────────────────────────────────────────

function RigaAudit({ riga }: { riga: ActivityLog }) {
  const meta = actionMeta(riga.action)
  const summary = riga.action === 'DELETE' ? riepilogo(riga.old_data) : riepilogo(riga.new_data)

  return (
    <div className="grid grid-cols-[150px_140px_130px_1fr] gap-3 items-center px-8 py-3 text-sm border-b border-gray-100">
      <span className="text-gray-500 tabular-nums">{formatDateTime(riga.created_at)}</span>
      <span className="text-gray-800 truncate" title={riga.user_email ?? ''}>{displayUser(riga.user_email)}</span>
      <span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${meta.badge}`}>
          <meta.Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </span>
      <span className="text-gray-700 truncate">
        <span className="font-medium">{tableLabel(riga.table_name)}</span>
        {riga.record_id && <span className="text-gray-400"> #{riga.record_id}</span>}
        {summary && <span className="text-gray-500"> — {summary}</span>}
      </span>
    </div>
  )
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function Auditing() {
  const { righe, loading, error, hasMore, loadMore, refresh } = useActivityLog()

  // filtri lato client sulle righe già caricate
  const [filtroAzione, setFiltroAzione] = useState<string>('all')
  const [filtroTabella, setFiltroTabella] = useState<string>('all')

  const tabelle = useMemo(() => {
    const s = new Set(righe.map(r => r.table_name))
    return [...s]
  }, [righe])

  const filtrate = useMemo(() => righe.filter(r =>
    (filtroAzione === 'all' || r.action === filtroAzione) &&
    (filtroTabella === 'all' || r.table_name === filtroTabella),
  ), [righe, filtroAzione, filtroTabella])

  const selectClass = 'h-9 px-3 border border-gray-300 rounded-md bg-white text-sm'

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader
        eyebrow="Amministrazione"
        title="Registro attività"
        actions={
          <>
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
            <button
              onClick={refresh}
              title="Aggiorna"
              className="h-9 px-3 inline-flex items-center gap-1.5 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </button>
          </>
        }
      />

      {/* Colonne */}
      <div className="grid grid-cols-[150px_140px_130px_1fr] gap-3 px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50 shrink-0">
        <span>Data e ora</span>
        <span>Utente</span>
        <span>Azione</span>
        <span>Dettaglio</span>
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
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            Nessuna attività registrata.
          </div>
        )}

        {filtrate.map(r => <RigaAudit key={r.id} riga={r} />)}

        {hasMore && filtroAzione === 'all' && filtroTabella === 'all' && (
          <div className="p-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="h-9 px-4 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Caricamento…' : 'Carica altri'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
