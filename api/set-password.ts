// Serverless function (Vercel, runtime Node): l'utente loggato cambia la
// propria password. Fatto lato server con la service_role key così da poter
// azzerare atomicamente il flag must_change_password (che il client non può
// modificare da solo, essendo user_roles in sola lettura via API).
import { createClient } from '@supabase/supabase-js'

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

  // ── Autenticazione: chiunque sia loggato può cambiare la PROPRIA password ─
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

  // ── Validazione ───────────────────────────────────────────────────────
  const body = (req.body ?? {}) as { password?: unknown }
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < 8) {
    res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' })
    return
  }

  // ── Aggiorna password dell'utente corrente ─────────────────────────────
  const { error: pwErr } = await admin.auth.admin.updateUserById(caller.user.id, { password })
  if (pwErr) {
    res.status(400).json({ error: pwErr.message ?? 'Cambio password fallito' })
    return
  }

  // ── Azzera il flag: il primo accesso è completato ──────────────────────
  await admin
    .from('user_roles')
    .update({ must_change_password: false })
    .eq('user_id', caller.user.id)

  res.status(200).json({ ok: true })
}
