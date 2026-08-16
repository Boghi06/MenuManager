// Serverless function (Vercel, runtime Node) per eliminare un utente.
//
// PERCHÉ SERVE UN ENDPOINT SERVER: cancellare un account in Supabase Auth
// richiede la SERVICE ROLE KEY, che non può stare nel frontend. La riga in
// public.user_roles sparisce da sola (FK on delete cascade su auth.users);
// il registro attività NON viene toccato: activity_log conserva user_id ed
// email come testo, quindi lo storico resta leggibile anche dopo.
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

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
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

  // ── 2. Validazione input ─────────────────────────────────────────────
  const body = (req.body ?? {}) as { userId?: unknown }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    res.status(400).json({ error: 'Utente da eliminare non specificato' })
    return
  }

  // Un admin non può cancellare sé stesso: eviterebbe di restare senza
  // amministratori (il chiamante è admin, quindi ne resta sempre almeno uno)
  // e si toglierebbe l'accesso mentre è loggato.
  if (userId === caller.user.id) {
    res.status(400).json({ error: 'Non puoi eliminare il tuo account' })
    return
  }

  const { data: target, error: targetErr } = await admin.auth.admin.getUserById(userId)
  if (targetErr || !target.user) {
    res.status(404).json({ error: 'Utente non trovato' })
    return
  }
  const email = target.user.email ?? ''
  const username = email.endsWith(`@${USERNAME_EMAIL_DOMAIN}`)
    ? email.slice(0, -(USERNAME_EMAIL_DOMAIN.length + 1))
    : email

  // ── 3. Eliminazione (user_roles va in cascade) ───────────────────────
  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) {
    res.status(500).json({ error: delErr.message ?? 'Eliminazione utente fallita' })
    return
  }

  res.status(200).json({ ok: true, username })
}
