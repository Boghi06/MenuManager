import { supabase } from '@/core/lib/supabase'
import type { UserRole } from './roles'

export interface NuovoUtente {
  username: string
  role: UserRole
}

export interface CreateUserResult {
  error: string | null
  /** Password iniziale generata dal server (presente solo se error === null). */
  password?: string
}

/** Utente esistente, come lo restituisce /api/list-users. */
export interface UtenteEsistente {
  id: string
  username: string
  role: UserRole
  /** true finché non ha cambiato la password iniziale. */
  mustChangePassword: boolean
  createdAt: string
  lastSignInAt: string | null
  /** true se è l'account con cui l'admin è loggato (non eliminabile). */
  isSelf: boolean
}

export interface ListUsersResult {
  error: string | null
  users: UtenteEsistente[]
}

async function accessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

/** Campi che ogni risposta può portare oltre al proprio payload. */
type ApiBody<T> = Partial<T> & { error?: string }

interface ApiResult<T> {
  error: string | null
  body: ApiBody<T>
}

/**
 * Chiamata JSON verso una serverless function `/api/*` con il token dell'utente.
 * Distingue il caso "endpoint non eseguito" (risposta non-JSON, tipico di
 * `npm run dev` che non serve le function, o di un deploy senza `api/`) dagli
 * errori applicativi veri, così il messaggio mostrato è diagnosticabile.
 */
async function callApi<T>(path: string, method: 'GET' | 'POST', payload?: unknown): Promise<ApiResult<T>> {
  const token = await accessToken()
  if (!token) return { error: 'Sessione scaduta, rientra e riprova.', body: {} }

  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: method === 'GET' ? undefined : JSON.stringify(payload ?? {}),
    })
  } catch {
    return { error: 'Impossibile contattare il server. Controlla la connessione.', body: {} }
  }

  // Se la risposta non è JSON, l'endpoint serverless non è stato eseguito:
  // in locale con `npm run dev` le function in api/ non girano (serve
  // `vercel dev` o il deploy su Vercel); in produzione può mancare il deploy.
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return {
      error: `Endpoint ${path} non disponibile (HTTP ${res.status}). Le funzioni in api/ girano solo su Vercel o con "vercel dev", non con "npm run dev".`,
      body: {},
    }
  }

  const body = await res.json().catch(() => ({})) as ApiBody<T>
  if (!res.ok) return { error: body.error ?? `Errore ${res.status}.`, body }
  return { error: null, body }
}

/**
 * Crea un utente via /api/create-user (che tiene la service_role key lato
 * server e genera la password iniziale). In caso di successo ritorna la
 * password generata, da comunicare all'utente.
 */
export async function createUser(input: NuovoUtente): Promise<CreateUserResult> {
  const { error, body } = await callApi<{ password: string }>('/api/create-user', 'POST', input)
  if (error) return { error }
  return { error: null, password: body.password }
}

/**
 * Elenco degli utenti via /api/list-users (auth.users non è leggibile dal
 * client). Riservato agli admin: per gli altri ruoli l'endpoint risponde 403.
 */
export async function listUsers(): Promise<ListUsersResult> {
  const { error, body } = await callApi<{ users: UtenteEsistente[] }>('/api/list-users', 'GET')
  if (error) return { error, users: [] }
  return { error: null, users: body.users ?? [] }
}

/**
 * Elimina definitivamente un utente via /api/delete-user (account Auth + riga
 * in user_roles, che va in cascade). Il server rifiuta l'auto-eliminazione.
 * Ritorna un messaggio d'errore o null.
 */
export async function deleteUser(userId: string): Promise<string | null> {
  const { error } = await callApi<{ username: string }>('/api/delete-user', 'POST', { userId })
  return error
}

/**
 * Cambia la password dell'utente corrente via /api/set-password (che aggiorna
 * la password e azzera il flag must_change_password lato server).
 * Ritorna un messaggio d'errore o null.
 */
export async function changeOwnPassword(newPassword: string): Promise<string | null> {
  const { error } = await callApi('/api/set-password', 'POST', { password: newPassword })
  return error
}
