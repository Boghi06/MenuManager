# Lancio di un nuovo cliente

Architettura: **una codebase, un deploy per cliente**. Ogni cliente ha il proprio
progetto Supabase (dati isolati) e il proprio progetto Vercel (build con il suo
branding e i suoi moduli). Il cliente viene selezionato a build-time tramite la
variabile `VITE_CLIENT`.

## Prerequisito una-tantum (baseline schema)

Le tabelle iniziali di Hotel Garden (`piatti`, `dish_types`, `activity_log`,
funzioni e trigger) furono create a mano nella dashboard e non esistono nelle
migrazioni. Prima del primo nuovo cliente:

```bash
scripts/export-baseline.sh "$HOTEL_GARDEN_DB_URL"   # genera migrations/modules/menu/000_baseline.sql
# rivedere il file, poi committarlo
```

Per i nuovi clienti basta la baseline: registrare le vecchie 002–015 come già
applicate (sono incluse nel dump):

```bash
scripts/apply-migrations.sh "$NUOVO_DB_URL" menu            # applica 000_baseline
```

> Nota: se la baseline copre già tutto, spostare le 002–015 in una cartella
> `legacy/` oppure registrarle con `--mark-applied` sul nuovo DB.

Per **Hotel Garden** (DB già migrato a mano) allineare una volta il registro:

```bash
scripts/apply-migrations.sh --mark-applied "$HOTEL_GARDEN_DB_URL" menu
```

## Procedura nuovo cliente

1. **Config nel repo**
   - Creare `src/config/clients/<cliente>.ts` (copiare `hotel-garden.ts`):
     colori brand, `appName`, path logo/favicon, `enabledModules` (`['menu']`,
     `['spa']` o entrambi).
   - Registrarlo nella mappa `CLIENTS` di `src/config/clients/index.ts`.
   - Aggiungere gli asset in `public/clients/<cliente>/` (`logo.svg`, `favicon.svg`).
   - Commit e push su `main`.

2. **Supabase**
   - Creare un nuovo progetto su [supabase.com](https://supabase.com) (region: eu-central).
   - Annotare: `Project URL`, `anon key` (Settings → API) e la connection string
     Postgres (Settings → Database, "Session pooler").
   - Applicare le migrazioni: `scripts/apply-migrations.sh "$DB_URL" <moduli...>`.
   - Creare il bucket storage `eventi-images` (pubblico in lettura) se il modulo
     menu è attivo.
   - Creare il primo utente **admin**: Authentication → Users → "Add user" con
     email `<nome>@utenti.local`, una password e **Auto Confirm User** attivo
     (il login avviene per nome utente, vedi CLAUDE.md § Ruoli utente). Poi
     Table Editor → `user_roles` → riga con `user_id` dell'utente e `role = admin`.
     Da quel momento l'admin può creare gli altri utenti dalla UI (Gestione utenti).

3. **Vercel**
   - "Add New Project" → importare **questa stessa repo GitHub**.
   - Environment variables:
     - `VITE_SUPABASE_URL` = Project URL del punto 2
     - `VITE_SUPABASE_ANON_KEY` = anon key del punto 2
     - `VITE_CLIENT` = id del cliente (es. `hotel-garden`)
     - `SUPABASE_URL` = stesso Project URL (serve alla serverless function, senza prefisso VITE)
     - `SUPABASE_SERVICE_ROLE_KEY` = **service_role** key (Project Settings → API).
       ⚠️ Solo lato server: la usa `api/create-user.ts` per creare utenti; non
       ha prefisso `VITE_`, quindi non finisce mai nel bundle client. Non condividerla.
   - Deploy. `vercel.json` (rewrite SPA con esclusione `/api` + security headers) si applica da solo.
   - Settings → Domains: collegare il dominio del cliente.

4. **Smoke test**
   - Login, tutte le route dei moduli abilitati, logo/colori corretti,
     anteprima di stampa, upload immagine evento.

## Aggiornamenti e manutenzione

- **Codice**: ogni push/merge su `main` fa ripartire la build di *tutti* i
  progetti Vercel collegati alla repo, ognuno con le proprie env → tutti i
  clienti si aggiornano insieme.
- **Migrazioni nuove**: vanno applicate a ogni DB cliente con
  `scripts/apply-migrations.sh` (tenere qui sotto l'elenco dei DB). Lo script
  salta quelle già applicate.
- **Attivare un modulo a un cliente esistente**: aggiungerlo a `enabledModules`
  nella sua config + applicare le migrazioni del modulo al suo DB.

### Registro clienti

| Cliente | VITE_CLIENT | Progetto Supabase | Dominio | Moduli |
|---|---|---|---|---|
| Hotel Garden Terme | `hotel-garden` | ubfjymdgcbtluuyqyicd | — | menu |

## Costi fissi (stime, verificare i listini)

**Costi tuoi, indipendenti dal numero di clienti:**

| Voce | Costo | Note |
|---|---|---|
| Vercel Pro | ~$20/mese | Il piano Hobby non è ammesso per uso commerciale; Pro copre N progetti nella stessa team |
| GitHub | 0 € | repo privata inclusa nel piano free |

**Costi per ogni cliente:**

| Voce | Costo | Note |
|---|---|---|
| Supabase | ~$25/mese il primo (org Pro, include $10 di compute), ~+$10/mese ogni progetto in più (istanza micro) | il tier Free non va usato in produzione: i progetti si pausano dopo 1 settimana di inattività |
| Dominio | ~10–15 €/anno | oppure 0 € se il cliente fornisce il suo dominio/sottodominio |

**Costo marginale reale per cliente: ~10–25 €/mese.**
Canone consigliato al cliente: **30–60 €/mese** per hosting + gestione
(aggiornamenti, backup, supporto base), più una-tantum di setup/personalizzazione.
Moduli aggiuntivi (es. spa) come voce di canone separata.
