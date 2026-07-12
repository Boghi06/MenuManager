# menu-app — Steering file per agenti

Leggi questo file prima di lavorare: descrive architettura, convenzioni e vincoli
del progetto. Segui queste regole anche quando il codice sembrerebbe permettere
alternative.

## Cos'è il progetto

Dashboard SaaS per hotel/ristoranti (primo cliente: **Hotel Garden Terme**) per
gestire piatti, pianificare menù bisettimanali, gestire eventi e stampare i menù
per gli ospiti (4 lingue: it/en/de/fr). SPA React servita da Vercel, dati su
Supabase (Postgres + Auth + Storage). Lingua del dominio, dei commenti e della UI: **italiano**.

## Stack

- **React 19 + TypeScript (strict) + Vite 8**, routing con react-router-dom 7
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, niente `tailwind.config`: la config è in CSS in `src/index.css`)
- **shadcn/ui** stile `base-nova` su Base UI (`@base-ui/react`) — vedi `components.json`
- **Supabase JS v2** — client unico in `src/core/lib/supabase.ts`
- Icone: **lucide-react**. Font: Geist Variable (sans), Fraunces Variable (serif)
- Nessun framework di state management, nessun React Query: hook custom + cache in-memory
- Nessun test runner configurato. Verifica: `npm run build` (tsc + vite) e `npm run lint`

Comandi: `npm run dev` | `npm run build` | `npm run lint` | `npm run preview`

## Architettura SaaS: una codebase, un deploy per cliente

**Niente multi-tenancy nel DB** (niente `tenant_id`). Ogni cliente ha:
- un proprio progetto Supabase (dati isolati)
- un proprio progetto Vercel che builda **questa stessa repo** con env dedicate

Il cliente è selezionato **a build-time** con `VITE_CLIENT` → risolto in
`src/config/clients/index.ts` (`clientConfig`). Fallback senza env: `hotel-garden`.
Env richieste: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLIENT`
(in locale: `.env.local`).

Un push su `main` rideploya **tutti** i clienti insieme: ogni modifica deve
essere retrocompatibile per ogni cliente attivo, oppure gestita via config cliente.

Runbook completo per lanciare un nuovo cliente (Supabase, Vercel, smoke test,
costi): **`docs/NEW_CLIENT.md`**. Registro clienti in fondo a quel file.

## Struttura delle cartelle (dove mettere le cose)

```
src/
  config/
    types.ts              # ClientConfig, BrandTheme, ModuleId
    clients/<id>.ts       # una config per cliente (branding, moduli, override)
    clients/index.ts      # mappa CLIENTS + resolveClient() da VITE_CLIENT
  core/                   # TUTTO ciò che è condiviso e client-agnostic
    auth/                 # Login, ProtectedRoute
    layout/               # AppLayout, AppHeader, AppSidebar (nav generata dai moduli)
    lib/                  # supabase.ts, cache.ts, utils.ts (cn)
    theme/applyTheme.ts   # inietta le CSS vars --brand* a runtime
    ui/                   # componenti shadcn generati (button, input, sheet, …)
    components/           # componenti condivisi non-shadcn (ConfirmDeleteDialog)
  modules/
    registry.ts           # MODULE_REGISTRY + getEnabledModules()
    menu/                 # modulo "menu" (unico attivo; "spa" previsto)
      index.tsx           # ModuleDefinition: routes (lazy) + navItems
      pages/  components/  hooks/  lib/  types/  constants/
  App.tsx                 # monta le route dei moduli abilitati dentro ProtectedRoute
  main.tsx                # applyTheme(clientConfig) PRIMA del render
public/clients/<id>/      # logo.svg, favicon.svg per cliente
migrations/core/          # migrazioni condivise (oggi vuota)
migrations/modules/<mod>/ # migrazioni SQL per modulo, numerate NNN_nome.sql
scripts/apply-migrations.sh   # applica core + moduli a un DB (idempotente, registro in public._migrations)
scripts/export-baseline.sh    # dump baseline da Hotel Garden (vedi gotcha sotto)
```

Regole di collocazione:
- Codice specifico di un dominio/modulo → sotto `src/modules/<modulo>/`, mai in `core/`.
- Codice riusabile tra moduli e privo di riferimenti al dominio → `src/core/`.
- **Mai** importare da un modulo dentro `core/`. I moduli possono importare da `core/` e `config/`.
- Differenze tra clienti → mai `if (cliente === …)` nel codice: aggiungere un campo
  a `ClientConfig` (in `src/config/types.ts`) con default sensato e leggerlo da `clientConfig`.
  Esempio esistente: `config.modules.menu.tipoBar` che sovrascrive `TIPO_BAR`.
- Alias import: `@/` → `src/` (vite.config.ts + tsconfig). Usarlo sempre, niente path relativi lunghi.
- Componenti shadcn nuovi: generarli in `src/core/ui/` (gli alias di `components.json` puntano già lì).

## Sistema moduli

Un modulo espone una `ModuleDefinition` (`src/modules/registry.ts`): `id`, `label`,
`defaultPath` (target del redirect da `/`), `routes` (`ModuleRoute` con pagine **lazy**
e `roles` opzionale: ruoli ammessi alla route) e `navItems` (label, path, icona lucide;
`roles` opzionale: ruoli che vedono la voce; se assente, visibile a tutti).

Per aggiungere un modulo:
1. `src/modules/<id>/index.tsx` con la `ModuleDefinition` (pagine con `lazy()`)
2. aggiungere l'id a `ModuleId` in `src/config/types.ts`
3. registrarlo in `MODULE_REGISTRY` in `src/modules/registry.ts`
4. abilitarlo in `enabledModules` delle config clienti interessate
5. migrazioni in `migrations/modules/<id>/` e applicarle ai DB dei clienti che lo usano

`App.tsx` monta automaticamente le route dei moduli abilitati; la sidebar si
costruisce dai `navItems`. Non aggiungere route a mano in `App.tsx`.

## Ruoli utente

Tre ruoli (`UserRole` in `src/core/auth/roles.ts`): **receptionist** (tutto tranne
la stampa ricette), **cucina** (piatti in lettura/scrittura, menù in sola
visualizzazione, stampa ricette al posto del menù clienti, niente eventi/footer),
**admin** (tutto + entrambe le stampe).

- Il ruolo vive in `public.user_roles` (migrazione `016_user_roles.sql`), una riga
  per utente. Senza riga → default `receptionist` (comportamento storico).
- **Creazione utenti (admin)**: pagina `/utenti` ("Gestione utenti",
  `pages/GestioneUtenti.tsx`) → chiama la serverless function `api/create-user.ts`
  che usa la **service_role key** (lato server, mai nel client) per creare
  l'account Auth (email `<nome>@utenti.local`, già confermato) e la riga in
  `user_roles`. La function verifica dal JWT che il chiamante sia admin, **genera
  una password iniziale casuale** e la restituisce all'admin (unica volta in cui
  è visibile). Il primo admin va comunque creato a mano in dashboard (vedi
  `docs/NEW_CLIENT.md`).
- **Cambio password al primo accesso**: gli utenti creati dall'admin hanno
  `user_roles.must_change_password = true` (migrazione `018`). `RoleProvider`
  legge il flag; `PasswordChangeGate` (`ForcePasswordChange.tsx`) sostituisce
  l'intera app con la schermata di cambio password finché non è completato. Il
  cambio passa da `api/set-password.ts` (service_role) che aggiorna la password
  e azzera il flag in modo atomico.
- Frontend: `ProtectedRoute` monta `RoleProvider` (fetch del ruolo, context);
  `useRole()` nei componenti, `RequireRole` come guardia di route, `roles` su
  navItems/routes dei moduli. Le pagine menù usano `readOnly = role === 'cucina'`.
- DB: policy RLS **restrictive** bloccano le scritture della cucina su menù,
  bisettimane, flag, eventi, footer e sul bucket `eventi-images` (difesa in
  profondità: la UI nasconde, la RLS impone).
- Nuove tabelle con scritture riservate: aggiungere le policy restrictive
  anti-cucina come in `016_user_roles.sql` (helper SQL `public.app_role()`).

**Auditing (solo admin)**: pagina `/auditing` ("Registro attività",
`pages/Auditing.tsx` + `hooks/useActivityLog.ts`) che legge `public.activity_log`.
Il log è popolato dai trigger `log_piatti_changes` su `piatti` e `menu_voci`
(snapshot old/new in jsonb); la migrazione `017_activity_log_audit.sql` aggiunge
la policy RLS di SELECT **solo per admin** (prima era una tabella solo-scrittura)
e ne definisce lo schema canonico per i nuovi clienti. La pagina mostra timeline
paginata con diff campo-per-campo sulle modifiche; i nomi utente si ricavano
dall'email sintetica (vedi login per nome utente).

## Theming (attenzione: fragile se fatto male)

- I colori brand vivono in `ClientConfig.theme.brand` (5 colori: primary=canvas,
  secondary=surface, accent, accentDark, text=ink).
- `applyTheme()` (`src/core/theme/applyTheme.ts`) li inietta a runtime su `:root`
  come `--brand`, `--brand-dark`, `--brand-surface`, `--brand-canvas`, `--brand-ink`,
  e imposta title + favicon. Viene chiamata in `main.tsx` prima del render.
- In `src/index.css` i token sono mappati con **`@theme inline`** su Tailwind
  (`--color-brand: var(--brand)` ⇒ classi `bg-brand`, `text-brand-ink`, …).
  **Vincolo critico: usare `@theme inline`, MAI `@theme` semplice** — con `@theme`
  Tailwind congela i valori a build-time e l'override runtime di `applyTheme()` smette di funzionare.
- Nei componenti usare le classi brand (`bg-brand`, `border-brand-dark`, ecc.),
  mai colori hex del cliente hardcoded.

## Dati e pattern degli hook

- Accesso ai dati sempre via hook custom in `src/modules/menu/hooks/` che usano
  il client `supabase` condiviso. Pattern consolidato (vedi `usePiatti.ts`):
  **stale-while-revalidate** con la cache di sessione `src/core/lib/cache.ts`
  (Map in-memory, si azzera al refresh) — al mount mostra la cache, rivalida in
  background, e ogni mutazione aggiorna ottimisticamente stato + cache.
- Le mutazioni ritornano `string | null` (messaggio errore) o `boolean`; gli errori
  si loggano in console e si mostrano in UI, non si lanciano eccezioni.
- Nuove entità: tipo in `modules/menu/types/`, hook in `hooks/`, costanti UI in `constants/`.

## Dominio (modulo menu)

- **Piatto** (`types/piatto.ts`): nomi in 4 lingue (`nome_it` obbligatorio, max 55 char),
  `tipo` a codici brevi **`ant | pr | se | con | des`** (mapping label↔codice in
  `constants/piatti.ts`), 4 caratteristiche (vegetariano/vegano/no lattosio/locale)
  e 14 allergeni booleani `all_*` numerati secondo la normativa UE.
- **Bisettimana**: unità di pianificazione di 14 giorni (`giorno` 0–13, 0 = lunedì
  settimana 1). Due per mese (A/B), range calcolato in `lib/bisettimane.ts`.
- **MenuVoce** (`types/menuVoce.ts`): una cella = (bisettimana, giorno, servizio
  `pranzo|cena`, sezione `ant|pr|se|des`, posizione 0–2). Il **contorno non è una
  sezione**: è l'attributo opzionale `contorno_id` di un secondo. Max alternative:
  1 antipasto, 3 primi, 3 secondi, 1 dessert (`SEZIONI_MAX`).
- **MenuFlag**: visibilità per giorno/servizio di elementi opzionali (succhi,
  insalate, formaggi, buffet dessert); se la riga non esiste in DB, default tutti `true`.
- **Eventi**: serate a tema collegate a giorno/servizio, con immagini nel bucket
  Storage `eventi-images`.
- **Footer del menù stampato**: configurato nella pagina Impostazioni (righe di
  piatti fissi + supplementi con prezzo, `lib/footer.ts`).
- **Stampa**: `components/menu/StampaPreview.tsx` (~680 righe) genera l'anteprima
  di stampa multilingua con CSS print inline. È il componente più delicato: le
  modifiche di layout stampa vanno verificate visivamente con l'anteprima.
- **Stampa ricette** (cucina/admin): `components/menu/StampaRicette.tsx` — PDF
  unico A4 verticale, solo italiano, con le tabelle RICETTE PRANZO e RICETTE CENA
  del giorno (codice = id piatto, caratteristiche, tipo, allergeni UE numerati dai
  campi `all_*`, testo `ricetta`). Stessa cautela di StampaPreview: verificare
  visivamente.

## Database e migrazioni

- Schema per modulo in `migrations/modules/<mod>/NNN_descrizione.sql`, numerazione
  progressiva a 3 cifre. Migrazioni condivise in `migrations/core/`.
- Applicare con `scripts/apply-migrations.sh "$DB_URL" menu` (DB_URL = connection
  string "Session pooler" di Supabase). Idempotente: registra i file in
  `public._migrations` e salta quelli già applicati. `--mark-applied` registra
  senza eseguire (per allineare DB esistenti).
- **Gotcha storico**: le tabelle base di Hotel Garden (`piatti`, `dish_types`,
  `activity_log`, funzioni e trigger) furono create a mano nella dashboard e NON
  esistono nelle migrazioni. Prima di lanciare un nuovo cliente serve generare la
  baseline con `scripts/export-baseline.sh` (→ `000_baseline.sql`). Dettagli in `docs/NEW_CLIENT.md`.
- Ogni nuova migrazione va applicata a **tutti** i DB dei clienti che hanno quel modulo.
- RLS attiva sulle tabelle: le nuove tabelle devono avere policy per utenti autenticati
  (vedi le migrazioni esistenti come riferimento, es. `004_security_hardening.sql`).

## Deploy e sicurezza

- Vercel: `vercel.json` contiene il rewrite SPA e gli header di sicurezza, inclusa
  una **CSP con l'URL Supabase hardcoded** (`connect-src`): oggi punta al progetto
  di Hotel Garden. Se si aggiunge un cliente o cambia il progetto Supabase, la CSP
  va aggiornata (limite noto dell'attuale setup single-file). Il rewrite SPA esclude
  `/api` per lasciar passare le serverless function.
- **Serverless function** (`api/*.ts`, runtime Node di Vercel): usate per le
  operazioni che richiedono la **service_role key**, che non può stare nel client.
  Oggi c'è `api/create-user.ts` (creazione utenti, vedi § Ruoli utente). Env server
  richieste sul progetto Vercel: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (senza
  prefisso `VITE_`, così restano fuori dal bundle). Type-check via `tsconfig.api.json`
  (referenziato dal `tsconfig.json` root); il build Vite non le tocca. In locale
  `npm run dev` non serve `/api`: serve `vercel dev` o il deploy per provarle.
- Auth: Supabase Auth email+password, ma il login avviene per **nome utente**:
  la pagina Login converte `nome` nell'email sintetica `nome@utenti.local`
  (`src/core/auth/username.ts`); un input con `@` viene usato com'è (account
  storici con email vera). Gli utenti si creano a mano dalla dashboard Supabase
  con email `<nome>@utenti.local` e **Auto Confirm User** attivo, e così il loro
  ruolo in `user_roles` (vedi sezione "Ruoli utente").

## Convenzioni di lavoro

- Branch per feature/fix, merge su `main` via PR. `main` = produzione (autodeploy di tutti i clienti).
- Messaggi di commit in italiano, stile conventional commits (`fix(stampa): …`, `refactor: …`, `chore: …`).
- Commenti nel codice in italiano, orientati al "perché" e ai vincoli.
- Prima di considerare finito un lavoro: `npm run build` e `npm run lint` puliti.
- Non committare `.env.local`; non introdurre dipendenze pesanti senza necessità
  (il progetto è volutamente leggero: niente Redux/React Query/form library).
