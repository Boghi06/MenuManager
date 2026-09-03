import { Plus, Pencil, Trash2 } from 'lucide-react'
import { TIPO_LABEL, CATEGORIA_LABEL, ALLERGENI, CARATTERISTICHE } from '@/modules/menu/constants/piatti'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

/**
 * Lettura umana di activity_log. Il trigger `log_piatti_changes` (migrazione
 * 004) salva in old_data/new_data lo snapshot JSON *completo* della riga prima
 * e dopo l'operazione: da soli quei due blob non dicono cosa sia cambiato.
 * Qui li si traduce in campi etichettati, valori leggibili e differenze.
 */

export type Snapshot = Record<string, unknown> | null

/**
 * Le uniche tabelle con un trigger di audit: piatti (004) e menu_voci (003).
 * Tutto il resto (flag del giorno, eventi, footer, utenti) non lascia traccia.
 */
export const TABELLE_TRACCIATE = ['piatti', 'menu_voci'] as const

const TABLE_LABELS: Record<string, string> = {
  piatti: 'Piatto',
  menu_voci: 'Voce di menù',
}

export function tableLabel(name: string): string {
  return TABLE_LABELS[name] ?? name
}

// ─── Giorni della bisettimana ────────────────────────────────────────────────

const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

/** `giorno` 0–13 → "Martedì · 1ª sett." (0–6 = prima settimana, 7–13 = seconda). */
export function giornoLabel(giorno: number): string {
  const nome = GIORNI[giorno % 7] ?? `giorno ${giorno}`
  return `${nome} · ${giorno < 7 ? '1ª' : '2ª'} sett.`
}

// ─── Etichette dei campi ─────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  // piatti
  nome_it: 'Nome (italiano)',
  nome_en: 'Nome (inglese)',
  nome_de: 'Nome (tedesco)',
  nome_fr: 'Nome (francese)',
  tipo: 'Portata',
  categoria: 'Categoria',
  ricetta: 'Ricetta',
  ...Object.fromEntries(CARATTERISTICHE.map(c => [c.field, c.label])),
  ...Object.fromEntries(ALLERGENI.map(a => [a.field, `Allergene · ${a.label}`])),
  // menu_voci
  bisettimana_id: 'Bisettimana',
  giorno: 'Giorno',
  servizio: 'Servizio',
  piatto_id: 'Piatto',
  contorno_id: 'Contorno',
  posizione: 'Alternativa',
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key
}

/** Ordine di lettura dei campi: prima l'identità, poi il resto, allergeni in coda. */
const FIELD_ORDER = [
  'nome_it', 'tipo', 'categoria', 'nome_en', 'nome_de', 'nome_fr', 'ricetta',
  ...CARATTERISTICHE.map(c => c.field),
  ...ALLERGENI.map(a => a.field),
  'bisettimana_id', 'giorno', 'servizio', 'piatto_id', 'contorno_id', 'posizione',
] as string[]

/** Campi tecnici che non dicono nulla all'utente: mai mostrati. */
const FIELD_HIDDEN = new Set(['id', 'created_at', 'updated_at'])

function ordineCampo(key: string): number {
  const i = FIELD_ORDER.indexOf(key)
  return i === -1 ? FIELD_ORDER.length : i
}

// ─── Contesto: id → nomi leggibili ───────────────────────────────────────────

export interface AuditContext {
  /** Nome del piatto per id (menu_voci salva solo gli id). */
  nomePiatto?: (id: number) => string | undefined
  /** Etichetta della bisettimana per uuid, es. "Aprile 2026 · A". */
  labelBisettimana?: (id: string) => string | undefined
}

const VUOTO = '—'

/** Valore di un campo in forma leggibile: booleani, id risolti, enum tradotti. */
export function formatValue(key: string, value: unknown, ctx: AuditContext = {}): string {
  if (value === null || value === undefined || value === '') return VUOTO
  if (typeof value === 'boolean') return value ? 'Sì' : 'No'

  switch (key) {
    case 'tipo':
      return TIPO_LABEL[String(value)] ?? String(value)
    case 'categoria':
      return CATEGORIA_LABEL[value as keyof typeof CATEGORIA_LABEL] ?? String(value)
    case 'servizio':
      return String(value) === 'cena' ? 'Cena' : 'Pranzo'
    case 'giorno':
      return giornoLabel(Number(value))
    case 'posizione':
      return `${Number(value) + 1}ª`
    case 'piatto_id':
    case 'contorno_id': {
      const nome = ctx.nomePiatto?.(Number(value))
      return nome ? `${nome} (#${value})` : `Piatto #${value}`
    }
    case 'bisettimana_id':
      return ctx.labelBisettimana?.(String(value)) ?? String(value)
    default:
      return String(value)
  }
}

// ─── Differenze e campi di uno snapshot ──────────────────────────────────────

export interface CampoAudit {
  key: string
  label: string
  /** Valore prima dell'operazione (vuoto per le creazioni). */
  prima: string
  /** Valore dopo l'operazione (vuoto per le eliminazioni). */
  dopo: string
}

/**
 * Campi effettivamente cambiati tra i due snapshot di un UPDATE.
 * Il confronto è sui valori grezzi, non sulle etichette: due valori diversi
 * che si formattano uguale (es. `null` e `''`) non contano come modifica.
 */
export function diffCampi(old_data: Snapshot, new_data: Snapshot, ctx: AuditContext = {}): CampoAudit[] {
  const before = old_data ?? {}
  const after = new_data ?? {}
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(k => !FIELD_HIDDEN.has(k))
    .filter(k => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null))

  return keys
    .sort((a, b) => ordineCampo(a) - ordineCampo(b))
    .map(key => ({
      key,
      label: fieldLabel(key),
      prima: formatValue(key, before[key], ctx),
      dopo: formatValue(key, after[key], ctx),
    }))
}

/**
 * Campi valorizzati di uno snapshot, per creazioni ed eliminazioni: si tengono
 * solo quelli con un contenuto (niente le decine di `false` degli allergeni,
 * che sono il default e non dicono nulla).
 */
export function campiValorizzati(data: Snapshot, ctx: AuditContext = {}): CampoAudit[] {
  if (!data) return []
  return Object.keys(data)
    .filter(k => !FIELD_HIDDEN.has(k))
    .filter(k => {
      const v = data[k]
      return v !== null && v !== undefined && v !== '' && v !== false
    })
    .sort((a, b) => ordineCampo(a) - ordineCampo(b))
    .map(key => ({ key, label: fieldLabel(key), prima: '', dopo: formatValue(key, data[key], ctx) }))
}

// ─── Descrizione della riga di log ───────────────────────────────────────────

export interface DescrizioneRiga {
  /** Cosa è stato toccato, in una riga: nome del piatto o della voce. */
  titolo: string
  /** Dove/come: portata, giorno, servizio, alternativa. */
  contesto: string
}

/** Snapshot di riferimento: il "dopo", o il "prima" per le eliminazioni. */
export function snapshotRilevante(riga: ActivityLog): Snapshot {
  return riga.action === 'DELETE' ? riga.old_data : (riga.new_data ?? riga.old_data)
}

/** Titolo e contesto leggibili di una riga di log, per tabella tracciata. */
export function descriviRiga(riga: ActivityLog, ctx: AuditContext = {}): DescrizioneRiga {
  const data = snapshotRilevante(riga) ?? {}

  if (riga.table_name === 'menu_voci') {
    const piattoId = data.piatto_id != null ? Number(data.piatto_id) : null
    const titolo = piattoId != null
      ? (ctx.nomePiatto?.(piattoId) ?? `Piatto #${piattoId}`)
      : `Voce #${riga.record_id ?? '?'}`
    const parti = [
      data.bisettimana_id ? ctx.labelBisettimana?.(String(data.bisettimana_id)) : undefined,
      data.giorno !== undefined ? giornoLabel(Number(data.giorno)) : undefined,
      data.servizio ? formatValue('servizio', data.servizio) : undefined,
      data.tipo ? TIPO_LABEL[String(data.tipo)] ?? String(data.tipo) : undefined,
      data.posizione !== undefined ? `${Number(data.posizione) + 1}ª alternativa` : undefined,
    ].filter(Boolean) as string[]
    return { titolo, contesto: parti.join(' · ') }
  }

  if (riga.table_name === 'piatti') {
    const titolo = typeof data.nome_it === 'string' && data.nome_it
      ? data.nome_it
      : `Piatto #${riga.record_id ?? '?'}`
    const parti = [
      data.tipo ? TIPO_LABEL[String(data.tipo)] ?? String(data.tipo) : undefined,
      data.categoria ? CATEGORIA_LABEL[data.categoria as keyof typeof CATEGORIA_LABEL] : undefined,
      riga.record_id ? `#${riga.record_id}` : undefined,
    ].filter(Boolean) as string[]
    return { titolo, contesto: parti.join(' · ') }
  }

  return {
    titolo: `${tableLabel(riga.table_name)}${riga.record_id ? ` #${riga.record_id}` : ''}`,
    contesto: '',
  }
}

/** Id dei piatti citati dalle voci di menù caricate, da risolvere in nomi. */
export function idsPiattiCitati(righe: ActivityLog[]): number[] {
  const ids = new Set<number>()
  for (const r of righe) {
    if (r.table_name !== 'menu_voci') continue
    for (const snap of [r.old_data, r.new_data]) {
      if (!snap) continue
      for (const key of ['piatto_id', 'contorno_id']) {
        const v = snap[key]
        if (typeof v === 'number') ids.add(v)
      }
    }
  }
  return [...ids]
}

// ─── Utenti e date ───────────────────────────────────────────────────────────

/** Nome utente dall'email sintetica <nome>@utenti.local (o email vera). */
export function displayUser(email: string | null): string {
  if (!email) return 'Sistema'
  return email.endsWith('@utenti.local') ? email.slice(0, -'@utenti.local'.length) : email
}

export function formatOra(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export function formatDataOra(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Intestazione del gruppo giornaliero: "Oggi", "Ieri" o la data estesa. */
export function labelGiornata(iso: string): string {
  const d = new Date(iso)
  const oggi = new Date()
  const stessoGiorno = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const ieri = new Date(oggi)
  ieri.setDate(ieri.getDate() - 1)

  if (stessoGiorno(d, oggi)) return 'Oggi'
  if (stessoGiorno(d, ieri)) return 'Ieri'
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Chiave di raggruppamento per giorno (locale, non UTC). */
export function chiaveGiornata(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// ─── Azioni ──────────────────────────────────────────────────────────────────

/** Etichetta, colori e verbo del dettaglio per ciascuna azione del trigger. */
export const ACTION_META: Record<string, { label: string; badge: string; Icon: typeof Plus; verbo: string }> = {
  CREATE: {
    label: 'Creazione', verbo: 'Creato con questi valori',
    badge: 'bg-green-100 text-green-800 border-green-200', Icon: Plus,
  },
  UPDATE: {
    label: 'Modifica', verbo: 'Campi modificati',
    badge: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Pencil,
  },
  DELETE: {
    label: 'Eliminazione', verbo: 'Valori al momento dell\u2019eliminazione',
    badge: 'bg-red-100 text-red-700 border-red-200', Icon: Trash2,
  },
}

export function actionMeta(action: string) {
  return ACTION_META[action] ?? {
    label: action, verbo: 'Dati', badge: 'bg-gray-100 text-gray-700 border-gray-200', Icon: Pencil,
  }
}

/**
 * Campi da mostrare per una riga: per gli UPDATE la differenza prima\u2192dopo, per
 * creazioni ed eliminazioni i valori valorizzati dello snapshot. Sta qui perch\u00e9
 * la usano sia la riga, sia il dettaglio, sia l'indice di ricerca della pagina.
 */
export function campiDellaRiga(riga: ActivityLog, ctx: AuditContext = {}): CampoAudit[] {
  return riga.action === 'UPDATE'
    ? diffCampi(riga.old_data, riga.new_data, ctx)
    : campiValorizzati(snapshotRilevante(riga), ctx)
}

/** Griglia condivisa da intestazione e righe della tabella: un punto solo. */
export const AUDIT_GRID =
  'grid grid-cols-[20px_58px_120px_118px_minmax(180px,1.25fr)_minmax(150px,1fr)] gap-3 items-baseline'
