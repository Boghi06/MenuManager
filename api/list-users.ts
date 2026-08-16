// Serverless function (Vercel, runtime Node): elenco degli utenti per l'admin.
//
// PERCHÉ SERVE UN ENDPOINT SERVER: la lista degli account vive in auth.users,
// non leggibile dal client, e la policy RLS su user_roles espone solo il
// proprio ruolo. Serve quindi la SERVICE ROLE KEY, che sta solo qui.
//
// Env richieste sul progetto Vercel del cliente:
//   SUPABASE_URL               (stesso valore di VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  (Project Settings → API → service_role)
//
// Autorizzazione: solo utenti con ruolo 'admin'.
import { createClient } from '@supabase/supabase-js'

// Deve combaciare con USERNAME_EMAIL_DOMAIN in src/core/auth/username.ts
// (duplicato per non attraversare il confine api/ ↔ src/).
const USERNAME_EMAIL_DOMAIN = 'utenti.local'

interface ApiRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
}

interface ApiResponse {
  status(code: number): ApiResponse
  json(data: unknown): void
}

/** Nome utente mostrato: parte prima della @ per le email sintetiche. */
function usernameDaEmail(email: string | undefined): string {
  if (!email) return '—'
  return email.endsWith(`@${USERNAME_EMAIL_DOMAIN}`)
    ? email.slice(0, -(USERNAME_EMAIL_DOMAIN.length + 1))
    : email
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo non consentito' })
    return
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    res.status(500).json({ error: 'Configurazione server mancante (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' })
    return
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── 1. Autorizzazione: il chiamante dev'essere admin ─────────────────
  const authHeader = req.headers['authorization']
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer /, '') : ''
  if (!token) {
    res.status(401).json({ error: 'Non autenticato' })
    return
  }

  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller.user) {
    res.status(401).json({ error: 'Sessione non valida' })
    return
  }

  const { data: callerRole } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.user.id)
    .maybeSingle()
  if (callerRole?.role !== 'admin') {
    res.status(403).json({ error: 'Operazione riservata agli amministratori' })
    return
  }

  // ── 2. Account + ruoli ───────────────────────────────────────────────
  // perPage 1000 (massimo GoTrue): gli hotel hanno una manciata di utenti,
  // se un giorno servisse di più va aggiunta la paginazione.
  const { data: lista, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) {
    res.status(500).json({ error: listErr.message ?? 'Lettura utenti fallita' })
    return
  }

  const { data: ruoli } = await admin.from('user_roles').select('user_id, role, must_change_password')
  const perUtente = new Map<string, { role?: string; must_change_password?: boolean }>()
  for (const r of ruoli ?? []) perUtente.set(r.user_id as string, r)

  // Senza riga in user_roles il ruolo è 'receptionist' (comportamento storico).
  const users = lista.users
    .map(u => {
      const riga = perUtente.get(u.id)
      return {
        id: u.id,
        username: usernameDaEmail(u.email),
        role: riga?.role ?? 'receptionist',
        mustChangePassword: riga?.must_change_password ?? false,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        // Calcolato qui: la UI disabilita l'eliminazione del proprio account.
        isSelf: u.id === caller.user.id,
      }
    })
    .sort((a, b) => a.username.localeCompare(b.username, 'it'))

  res.status(200).json({ users })
}
