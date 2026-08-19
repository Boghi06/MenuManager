#!/usr/bin/env node
// Scarica l'elenco piatti dal Supabase configurato in .env.local e lo scrive
// come JSON su stdout. Serve alle analisi una tantum sui dati reali: `piatti`
// non è leggibile con la sola anon key (GRANT revocato ad anon dalla 004),
// quindi fa login con un account dell'app e usa il JWT.
//
// Uso:
//   node scripts/fetch-piatti.mjs <utente> <password> > piatti.json
//
// Lo script non salva né logga la password, ma passandola come argomento resta
// nella history della shell e nella lista processi: usare un account di servizio
// o ripulire la history dopo l'uso.
import { readFileSync } from 'node:fs'

const [utente, password] = process.argv.slice(2)
if (!utente || !password) {
  console.error('Uso: node scripts/fetch-piatti.mjs <utente> <password> > piatti.json')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(r => r.includes('='))
    .map(r => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()]),
)
const URL_BASE = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
if (!URL_BASE || !ANON) { console.error('.env.local senza VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'); process.exit(1) }

// Stessa conversione della pagina di login: nome utente → email sintetica.
const email = utente.includes('@') ? utente : `${utente}@utenti.local`

const login = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: ANON, 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
if (!login.ok) { console.error(`Login fallito (${login.status}): ${await login.text()}`); process.exit(1) }
const { access_token } = await login.json()

const leggi = (campi) => fetch(
  `${URL_BASE}/rest/v1/piatti?select=${campi}&order=id`,
  { headers: { apikey: ANON, Authorization: `Bearer ${access_token}` } },
)

// Se la 021 non è ancora stata applicata la colonna `categoria` non esiste e
// PostgREST risponde 400: in quel caso rileggiamo senza, e lo diciamo.
let res = await leggi('id,nome_it,tipo,categoria,vegetariano,vegano')
if (res.status === 400) {
  console.error('⚠️  colonna `categoria` assente: la migrazione 021 non è applicata a questo DB')
  res = await leggi('id,nome_it,tipo,vegetariano,vegano')
}
if (!res.ok) { console.error(`Lettura piatti fallita (${res.status}): ${await res.text()}`); process.exit(1) }

const piatti = await res.json()
console.error(`piatti letti: ${piatti.length}`)
process.stdout.write(JSON.stringify(piatti))
