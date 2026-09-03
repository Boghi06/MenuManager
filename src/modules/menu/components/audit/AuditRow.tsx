import { useState } from 'react'
import { ChevronRight, ArrowRight } from 'lucide-react'
import {
  actionMeta, campiDellaRiga, descriviRiga, displayUser,
  formatDataOra, formatOra, tableLabel, AUDIT_GRID,
} from '@/modules/menu/lib/audit'
import type { AuditContext, CampoAudit } from '@/modules/menu/lib/audit'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

// ─── Valore di un campo ──────────────────────────────────────────────────────

function Valore({ testo, tono }: { testo: string; tono: 'prima' | 'dopo' }) {
  return (
    <span
      className={`inline-block max-w-full align-top break-words whitespace-pre-wrap rounded px-1.5 py-0.5
                  ${tono === 'prima'
                    ? 'bg-red-50 text-red-900/80 line-through decoration-red-300'
                    : 'bg-green-50 text-green-900'}`}
    >
      {testo}
    </span>
  )
}

// ─── Dettaglio espanso ───────────────────────────────────────────────────────

function Dettaglio({ riga, campi, ctx }: { riga: ActivityLog; campi: CampoAudit[]; ctx: AuditContext }) {
  const meta = actionMeta(riga.action)
  const { titolo, contesto } = descriviRiga(riga, ctx)
  const isUpdate = riga.action === 'UPDATE'

  return (
    <div className="px-8 pb-5 pt-1 bg-gray-50/60 border-b border-gray-100">
      <div className="ml-8 border-l-2 border-gray-200 pl-4">
        {/* intestazione del dettaglio: cosa, dove, quando, chi */}
        <div className="mb-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{tableLabel(riga.table_name)}</span>
          {riga.record_id && <span className="text-gray-400"> #{riga.record_id}</span>}
          <span> · {titolo}</span>
          {contesto && <span> · {contesto}</span>}
          <span> · {formatDataOra(riga.created_at)}</span>
          <span> · {displayUser(riga.user_email)}</span>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          {meta.verbo}
          {campi.length > 0 && <span className="text-gray-400 font-normal normal-case"> · {campi.length}</span>}
        </div>

        {campi.length === 0 ? (
          <p className="text-sm text-gray-500">
            {isUpdate
              ? 'Salvataggio senza variazioni: nessun campo è cambiato rispetto a prima.'
              : 'Nessun dato registrato per questa operazione.'}
          </p>
        ) : (
          <div className="max-w-3xl border border-gray-200 rounded-md bg-white overflow-hidden">
            {campi.map((c, i) => (
              <div
                key={c.key}
                className={`grid grid-cols-[190px_1fr] gap-3 px-3 py-2 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <span className="text-gray-500">{c.label}</span>
                {isUpdate ? (
                  <span className="flex items-start gap-2 flex-wrap min-w-0">
                    <Valore testo={c.prima} tono="prima" />
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1" />
                    <Valore testo={c.dopo} tono="dopo" />
                  </span>
                ) : (
                  <span className="text-gray-900 break-words whitespace-pre-wrap min-w-0">{c.dopo}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Riga ────────────────────────────────────────────────────────────────────

/**
 * Una riga del registro: sintesi sempre visibile (quando, chi, azione, cosa,
 * quali campi) ed espansione col dettaglio completo prima→dopo.
 */
export function AuditRow({ riga, ctx }: { riga: ActivityLog; ctx: AuditContext }) {
  const [aperta, setAperta] = useState(false)
  const meta = actionMeta(riga.action)
  const { titolo, contesto } = descriviRiga(riga, ctx)
  const campi = campiDellaRiga(riga, ctx)

  // riassunto: i campi toccati, troncati per non far crescere la riga
  const nomiCampi = campi.map(c => c.label)
  const riassunto = nomiCampi.slice(0, 3).join(', ')
  const extra = nomiCampi.length - 3

  return (
    <>
      <button
        type="button"
        onClick={() => setAperta(v => !v)}
        aria-expanded={aperta}
        className={`w-full text-left ${AUDIT_GRID} px-8 py-3 text-sm border-b border-gray-100
                    transition-colors hover:bg-gray-50 ${aperta ? 'bg-gray-50' : ''}`}
      >
        <ChevronRight
          className={`w-4 h-4 text-gray-400 self-center transition-transform ${aperta ? 'rotate-90' : ''}`}
        />
        <span className="text-gray-500 tabular-nums" title={formatDataOra(riga.created_at)}>
          {formatOra(riga.created_at)}
        </span>
        <span className="text-gray-800 truncate" title={riga.user_email ?? 'Nessun utente autenticato'}>
          {displayUser(riga.user_email)}
        </span>
        <span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${meta.badge}`}>
            <meta.Icon className="w-3 h-3" />
            {meta.label}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-gray-900 truncate">{titolo}</span>
          <span className="block text-xs text-gray-500 truncate">
            {tableLabel(riga.table_name)}
            {contesto && ` · ${contesto}`}
          </span>
        </span>
        <span className="min-w-0 text-gray-600 text-xs">
          {campi.length === 0 ? (
            <span className="text-gray-400">nessuna variazione</span>
          ) : (
            <>
              <span className="block truncate" title={nomiCampi.join(', ')}>{riassunto}</span>
              {extra > 0 && <span className="text-gray-400">+ altri {extra}</span>}
            </>
          )}
        </span>
      </button>

      {aperta && <Dettaglio riga={riga} campi={campi} ctx={ctx} />}
    </>
  )
}
