import { useState } from 'react'
import { UserPlus, Check, AlertCircle, Copy } from 'lucide-react'
import { AppLayout } from '@/core/layout/AppLayout'
import { Input } from '@/core/ui/input'
import { Button } from '@/core/ui/button'
import { createUser } from '@/core/auth/adminUsers'
import { USER_ROLES, type UserRole } from '@/core/auth/roles'

// Descrizione di ciascun ruolo, mostrata sotto il selettore.
const ROLE_INFO: Record<UserRole, { label: string; descrizione: string }> = {
  receptionist: {
    label: 'Receptionist',
    descrizione: 'Gestione completa di menù, eventi e footer; stampa dei menù per i clienti.',
  },
  cucina: {
    label: 'Cucina',
    descrizione: 'Consulta piatti e menù (sola lettura) e stampa le ricette del giorno con allergeni.',
  },
  admin: {
    label: 'Amministratore',
    descrizione: 'Accesso completo: tutte le funzioni, il registro attività e la gestione utenti.',
  },
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
    }
    setLoading(false)
  }

  const copiaCredenziali = async () => {
    if (!creato) return
    await navigator.clipboard.writeText(`Utente: ${creato.username}\nPassword: ${creato.password}`)
    setCopiato(true)
    setTimeout(() => setCopiato(false), 2000)
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-200">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Amministrazione
        </p>
        <h1 className="text-4xl font-light font-fraunces leading-none">
          Gestione{' '}
          <span className="italic font-normal underline decoration-2 underline-offset-4"
                style={{ textDecorationColor: 'var(--brand)' }}>
            utenti
          </span>
        </h1>
      </div>

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-lg">
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
                <button
                  type="button"
                  onClick={copiaCredenziali}
                  className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 transition-colors"
                >
                  {copiato ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiato ? 'Copiato' : 'Copia'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
