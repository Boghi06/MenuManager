import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Check, AlertCircle, Copy, Printer, Trash2, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { PageHeader } from '@/core/layout/PageHeader'
import { Input } from '@/core/ui/input'
import { Button } from '@/core/ui/button'
import { ConfirmDeleteDialog } from '@/core/components/ConfirmDeleteDialog'
import { clientConfig } from '@/config/clients'
import { createUser, deleteUser, listUsers, type UtenteEsistente } from '@/core/auth/adminUsers'
import { USER_ROLES, type UserRole } from '@/core/auth/roles'

// Descrizione di ciascun ruolo, mostrata sotto il selettore.
const ROLE_INFO: Record<UserRole, { label: string; descrizione: string; badge: string }> = {
  receptionist: {
    label: 'Receptionist',
    descrizione: 'Gestione completa di menù, eventi e footer; stampa dei menù per i clienti.',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  cucina: {
    label: 'Cucina',
    descrizione: 'Consulta piatti e menù (sola lettura) e stampa le ricette del giorno con allergeni.',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  admin: {
    label: 'Amministratore',
    descrizione: 'Accesso completo: tutte le funzioni, il registro attività e la gestione utenti.',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
}

/** Etichetta del ruolo, tollerante a valori non previsti letti dal DB. */
function roleInfo(role: UserRole) {
  return ROLE_INFO[role] ?? { label: role, descrizione: '', badge: 'bg-gray-100 text-gray-700 border-gray-200' }
}

function formatData(iso: string | null): string {
  if (!iso) return 'mai'
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface UtenteCreato {
  username: string
  password: string
  role: UserRole
}

export default function GestioneUtenti() {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<UserRole>('receptionist')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creato, setCreato] = useState<UtenteCreato | null>(null)
  const [copiato, setCopiato] = useState(false)

  // Elenco utenti: letto da /api/list-users (auth.users non è leggibile dal client).
  const [utenti, setUtenti] = useState<UtenteEsistente[]>([])
  const [utentiLoading, setUtentiLoading] = useState(true)
  const [utentiError, setUtentiError] = useState<string | null>(null)
  const [daEliminare, setDaEliminare] = useState<UtenteEsistente | null>(null)
  const [eliminando, setEliminando] = useState(false)
  // incrementato da ricaricaUtenti() per ri-lanciare l'effetto di fetch
  const [utentiNonce, setUtentiNonce] = useState(0)

  // `utentiLoading` viene alzato in ricaricaUtenti(), non qui: evita setState
  // sincrono nel body dell'effetto (cascading renders), come in useActivityLog.
  useEffect(() => {
    let cancelled = false
    listUsers().then(({ error: err, users }) => {
      if (cancelled) return
      setUtentiError(err)
      setUtenti(users)
      setUtentiLoading(false)
    })
    return () => { cancelled = true }
  }, [utentiNonce])

  const ricaricaUtenti = useCallback(() => {
    setUtentiLoading(true)
    setUtentiNonce(n => n + 1)
  }, [])

  const confermaEliminazione = async () => {
    if (!daEliminare) return
    setEliminando(true)
    const err = await deleteUser(daEliminare.id)
    setEliminando(false)
    setDaEliminare(null)
    if (err) {
      setUtentiError(err)
      return
    }
    setUtentiError(null)
    // Rimozione ottimistica + ricarica, così l'elenco resta allineato al server.
    setUtenti(prev => prev.filter(u => u.id !== daEliminare.id))
    ricaricaUtenti()
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCreato(null)
    setCopiato(false)

    const nome = username.trim().toLowerCase()
    const { error: err, password } = await createUser({ username: nome, role })

    if (err || !password) {
      setError(err ?? 'Errore nella creazione utente.')
    } else {
      setCreato({ username: nome, password, role })
      setUsername('')
      setRole('receptionist')
      ricaricaUtenti()
    }
    setLoading(false)
  }

  const copiaCredenziali = async () => {
    if (!creato) return
    await navigator.clipboard.writeText(`Utente: ${creato.username}\nPassword: ${creato.password}`)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 2000)
  }

  const stampaCredenziali = () => {
    if (!creato) return
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    const origin = window.location.origin
    // Valori sicuri da interpolare: username è validato [a-z0-9._-], password
    // è alfanumerica generata dal server, ruolo da enum, resto da config.
    win.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Credenziali ${creato.username}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 24mm; }
    body { font-family: system-ui, Arial, sans-serif; color: #111; }
    .sheet { max-width: 540px; margin: 0 auto; }
    .logo { height: 56px; margin-bottom: 36px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
    .sub { color: #555; font-size: 14px; margin-bottom: 28px; }
    .box { border: 1px solid #ccc; border-radius: 10px; padding: 6px 24px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 13px; }
    .value { font-weight: 700; font-size: 16px; text-align: right; }
    .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 1px; }
    .note { margin-top: 26px; font-size: 12px; color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="sheet">
    <img class="logo" src="${origin}${clientConfig.logo}" alt="${clientConfig.appName}">
    <h1>Credenziali di accesso</h1>
    <div class="sub">${clientConfig.appName}</div>
    <div class="box">
      <div class="row"><span class="label">Indirizzo</span><span class="value">${origin}</span></div>
      <div class="row"><span class="label">Nome utente</span><span class="value">${creato.username}</span></div>
      <div class="row"><span class="label">Password iniziale</span><span class="value mono">${creato.password}</span></div>
      <div class="row"><span class="label">Ruolo</span><span class="value">${ROLE_INFO[creato.role].label}</span></div>
    </div>
    <div class="note">
      Al primo accesso ti verrà chiesto di sostituire la password iniziale con una password personale.
      Conserva questo foglio in un luogo sicuro e non condividerlo.
    </div>
  </div>
</body>
</html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  return (
    <AppLayout>
      {/* Header */}
      <PageHeader eyebrow="Amministrazione" title="Gestione utenti" />

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl flex flex-col gap-10">
        <section className="max-w-lg">
          <h2 className="font-geist text-lg mb-1">Nuovo utente</h2>
          <p className="text-sm text-gray-500 mb-6">
            L'accesso avviene con il <strong>nome utente</strong> (non serve un'email). La password
            iniziale è generata automaticamente: l'utente dovrà cambiarla al primo accesso.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-username" className="text-sm font-medium text-gray-700">Nome utente</label>
              <Input
                id="new-username"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                placeholder="es. cucina"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="h-11 border-gray-300 rounded-lg bg-white"
              />
              <span className="text-xs text-gray-400">Min 3 caratteri: lettere, numeri, punto, trattino, underscore.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-role" className="text-sm font-medium text-gray-700">Ruolo</label>
              <select
                id="new-role"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="h-11 px-3 border border-gray-300 rounded-lg bg-white text-sm"
              >
                {USER_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 leading-relaxed">{ROLE_INFO[role].descrizione}</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-black text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creazione in corso…' : 'Crea utente'}
            </Button>
          </form>

          {/* Credenziali generate: unica occasione per vederle */}
          {creato && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-3">
                <Check className="w-4 h-4" />
                Utente "{creato.username}" creato come {ROLE_INFO[creato.role].label}
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Comunica queste credenziali all'utente. La password non sarà più visibile:
                l'utente dovrà cambiarla al primo accesso.
              </p>
              <div className="flex items-center justify-between gap-3 bg-white rounded-md border border-green-200 px-3 py-2">
                <div className="text-sm">
                  <div><span className="text-gray-500">Utente:</span> <strong>{creato.username}</strong></div>
                  <div><span className="text-gray-500">Password:</span> <strong className="font-mono">{creato.password}</strong></div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copiaCredenziali}
                    className="inline-flex items-center gap-1.5 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors"
                  >
                    {copiato ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copiato ? 'Copiato' : 'Copia'}
                  </button>
                  <button
                    type="button"
                    onClick={stampaCredenziali}
                    className="inline-flex items-center gap-1.5 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Stampa
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Elenco utenti + eliminazione */}
        <section>
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-geist text-lg">Utenti esistenti</h2>
            <button
              type="button"
              onClick={ricaricaUtenti}
              disabled={utentiLoading}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${utentiLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            L'eliminazione è definitiva: l'utente perde subito l'accesso. Le modifiche già
            registrate nel registro attività restano.
          </p>

          {utentiError && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {utentiError}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {utentiLoading && utenti.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">Caricamento utenti…</div>
            )}
            {!utentiLoading && utenti.length === 0 && !utentiError && (
              <div className="px-4 py-6 text-sm text-gray-500">Nessun utente da mostrare.</div>
            )}
            {utenti.map(u => (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {u.username}
                    {u.isSelf && <span className="ml-2 text-xs font-normal text-gray-400">(tu)</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ultimo accesso: {formatData(u.lastSignInAt)}
                    {u.mustChangePassword && <span className="text-amber-700"> · password iniziale da cambiare</span>}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${roleInfo(u.role).badge}`}>
                  {roleInfo(u.role).label}
                </span>
                <button
                  type="button"
                  onClick={() => setDaEliminare(u)}
                  disabled={u.isSelf || eliminando}
                  title={u.isSelf ? 'Non puoi eliminare il tuo account' : `Elimina ${u.username}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-300 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={daEliminare !== null}
        onClose={() => setDaEliminare(null)}
        onConfirm={() => void confermaEliminazione()}
        title={`Eliminare l'utente "${daEliminare?.username ?? ''}"?`}
        description="Questa azione non è reversibile: l'account viene cancellato e l'utente perde immediatamente l'accesso all'applicazione."
      />
    </AppLayout>
  )
}
