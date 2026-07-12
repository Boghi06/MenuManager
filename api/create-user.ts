// Serverless function (Vercel, runtime Node) per creare utenti.
//
// PERCHÉ SERVE UN ENDPOINT SERVER: creare un utente in Supabase Auth e
// assegnargli un ruolo richiede la SERVICE ROLE KEY, che bypassa la RLS e
// NON può stare nel frontend. Qui vive lato server, letta dalle env di
// Vercel (mai esposta al client).
//
// Env richieste sul progetto Vercel del cliente:
//   SUPABASE_URL               (stesso valore di VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  (Project Settings → API → service_role)
//
// Autorizzazione: l'endpoint verifica dal JWT del chiamante che sia un
// utente con ruolo 'admin' prima di procedere.
import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'node:crypto'

// Deve combaciare con USERNAME_EMAIL_DOMAIN in src/core/auth/username.ts
// (duplicato per non attraversare il confine api/ ↔ src/).
const USERNAME_EMAIL_DOMAIN = 'utenti.local'
const RUOLI_VALIDI = ['receptionist', 'cucina', 'admin']

// Password iniziale casuale: charset senza caratteri ambigui (0/O, 1/l/I),
// così è facile da leggere e comunicare all'utente.
function generaPasswordIniziale(len = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[randomInt(chars.length)]
  return out
}

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

  // Client con privilegi di servizio: bypassa la RLS, usato solo qui.
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
  // La password NON arriva dal client: è generata qui e restituita all'admin,
  // che la comunica all'utente. Al primo accesso l'utente dovrà cambiarla.
  const body = (req.body ?? {}) as { username?: unknown; role?: unknown }
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const role = typeof body.role === 'string' ? body.role : ''

  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    res.status(400).json({ error: 'Nome utente non valido (min 3 caratteri: lettere, numeri, . _ -)' })
    return
  }
  if (!RUOLI_VALIDI.includes(role)) {
    res.status(400).json({ error: 'Ruolo non valido' })
    return
  }

  const email = username.includes('@') ? username : `${username}@${USERNAME_EMAIL_DOMAIN}`
  const password = generaPasswordIniziale()

  // ── 3. Creazione utente (email già confermata: niente mail reale) ────
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createErr || !created.user) {
    const already = createErr?.message?.toLowerCase().includes('already')
    res.status(400).json({ error: already ? 'Nome utente già esistente' : (createErr?.message ?? 'Creazione utente fallita') })
    return
  }

  // ── 4. Assegnazione ruolo + flag cambio password (rollback se fallisce) ─
  const { error: roleErr } = await admin
    .from('user_roles')
    .insert({ user_id: created.user.id, role, must_change_password: true })
  if (roleErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    res.status(500).json({ error: 'Utente creato ma assegnazione ruolo fallita, operazione annullata' })
    return
  }

  // Password restituita SOLO all'admin che ha appena creato l'utente.
  res.status(200).json({ ok: true, username, role, password })
}
