import {
  Salad, Leaf, MilkOff, ChefHat,
  Nut, Shell, Wheat, Egg, Milk, Fish, Bean, Sprout, FlaskConical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { clientConfig } from '@/config/clients'
import type { CategoriaPiatto, PiattoForm, TranslationField } from '@/modules/menu/types/piatto'

// I tipi di piatto sono le parole intere `antipasti | primi | secondi | contorni`:
// sono gli stessi valori salvati in DB (dish_types.code, piatti.tipo,
// menu_voci.tipo), quindi non serve nessuna conversione label↔codice.
// Niente dessert: a fine pasto c'è sempre e solo il "Buffet di dessert",
// gestito come flag per giorno/servizio (show_buffet_dessert), non come piatto.
export const TIPO_LABEL: Record<string, string> = {
  antipasti: 'Antipasto', primi: 'Primo', secondi: 'Secondo', contorni: 'Contorno',
}

// Tipi selezionabili nel form del piatto, nell'ordine delle portate.
export const TIPI_PIATTO = ['antipasti', 'primi', 'secondi', 'contorni'] as const

/**
 * Portate di un piatto. Un piatto può starne in più di una (migrazione 026):
 * `tipi` è l'elenco completo, `tipo` la principale. Il fallback su `tipo` serve
 * ai piatti letti da una cache di sessione precedente al deploy, dove `tipi`
 * ancora non c'era.
 */
export function portateDi(piatto: { tipo: string | null; tipi?: string[] | null }): string[] {
  if (piatto.tipi && piatto.tipi.length > 0) return piatto.tipi
  return piatto.tipo ? [piatto.tipo] : []
}

/** "Antipasto · Secondo" — le portate di un piatto in forma leggibile. */
export function etichettaPortate(piatto: { tipo: string | null; tipi?: string[] | null }): string {
  const portate = portateDi(piatto).map(t => TIPO_LABEL[t] ?? t)
  return portate.length > 0 ? portate.join(' · ') : '—'
}

// Abbreviazioni per la colonna "tipo" della stampa ricette, larga 34px:
// le parole intere ci andrebbero a capo. Solo presentazione, mai valori salvati.
export const TIPO_ABBR: Record<string, string> = {
  antipasti: 'ant', primi: 'pr', secondi: 'se', contorni: 'con',
}

// righe (sezioni) della griglia composizione — il contorno NON è una riga
export const SEZIONI_ORDER = ['antipasti', 'primi', 'secondi'] as const

// numero massimo di alternative per sezione: 1 antipasto, 3 primi, 4 secondi
export const SEZIONI_MAX: Record<string, number> = {
  antipasti: 1, primi: 3, secondi: 4,
}

// Il quarto secondo è l'alternativa libera in fondo alla colonna (nel foglio
// della cucina è il piatto vegetariano): sta da solo, senza contorno, in
// griglia come in stampa. Il vincolo è anche a DB (migrazione 023).
export const SECONDI_CON_CONTORNO = 3
export const secondoHaContorno = (posizione: number) => posizione < SECONDI_CON_CONTORNO

// barra-tipo in scala di grigi (mini-bar a sinistra di un piatto);
// personalizzabile per cliente via config.modules.menu.tipoBar
const DEFAULT_TIPO_BAR: Record<string, string> = {
  antipasti: '#000000', primi: '#1F1F1F', secondi: '#3D3D3D', contorni: '#737373',
}
export const TIPO_BAR: Record<string, string> = {
  ...DEFAULT_TIPO_BAR,
  ...clientConfig.modules?.menu?.tipoBar,
}

// variante usata dalle card piatto in Dashboard (era TIPO_BAR in src/constants.ts)
export const TIPO_BAR_CARD: Record<string, string> = {
  primi:    '#000000',
  secondi:  '#3D3D3D',
  contorni: '#737373',
}

// ─── Categoria merceologica (carne | pesce | vegetariano) ────────────────────
// Asse indipendente dalla portata (`tipo`): dice di cosa è fatto il piatto.
// Da non confondere con `CATEGORIE` in fondo al file, che è il filtro per
// portata della sidebar dell'elenco piatti.

export const CATEGORIE_PIATTO = ['carne', 'pesce', 'vegetariano'] as const

export const CATEGORIA_LABEL: Record<CategoriaPiatto, string> = {
  carne: 'Carne', pesce: 'Pesce', vegetariano: 'Vegetariano',
}

// Leggenda della barra verticale del piatto: rosso carne, blu pesce, verde
// vegetariano. Colori fissi e non brandizzati: sono un codice di lettura del
// menù, devono restare gli stessi per ogni cliente.
export const CATEGORIA_BAR: Record<CategoriaPiatto, string> = {
  carne: '#DC2626', pesce: '#2563EB', vegetariano: '#16A34A',
}

/**
 * Colore della barra di un piatto: la categoria se assegnata, altrimenti il
 * grigio storico per portata passato come `fallback`. I piatti in archivio
 * senza categoria continuano così a mostrarsi come prima.
 */
export function coloreBarraPiatto(
  categoria: CategoriaPiatto | string | null | undefined,
  fallback: string,
): string {
  return (categoria && CATEGORIA_BAR[categoria as CategoriaPiatto]) || fallback
}

export const EMPTY_FORM: PiattoForm = {
  nome_it: '', nome_en: '', nome_fr: '', nome_de: '',
  tipo: 'primi', tipi: ['primi'], categoria: null, ricetta: '',
  vegetariano: false, vegano: false, no_lattosio: false, locale: false,
  all_glutine: false, all_crostacei: false, all_uova: false, all_pesce: false,
  all_arachidi: false, all_soia: false, all_latte: false, all_frutta_guscio: false,
  all_sedano: false, all_senape: false, all_sesamo: false, all_solfiti: false,
  all_lupini: false, all_molluschi: false,
}

export interface CaratteristicaConfig {
  field: keyof PiattoForm
  label: string
  Icon: LucideIcon
  isAccent: boolean
}

export interface AllergenoConfig {
  field: keyof PiattoForm
  label: string
  Icon: LucideIcon
  number: number
}

export const CARATTERISTICHE: CaratteristicaConfig[] = [
  { field: 'vegetariano', label: 'Vegetariano',   Icon: Salad,   isAccent: false },
  { field: 'vegano',      label: 'Vegano',         Icon: Leaf,    isAccent: false },
  { field: 'no_lattosio', label: 'Senza lattosio', Icon: MilkOff, isAccent: false },
  { field: 'locale',      label: 'Locale',         Icon: ChefHat, isAccent: true  },
]

export const ALLERGENI: AllergenoConfig[] = [
  { field: 'all_glutine',       label: 'Glutine',         Icon: Wheat,         number: 1  },
  { field: 'all_crostacei',     label: 'Crostacei',       Icon: Shell,         number: 2  },
  { field: 'all_uova',          label: 'Uova',            Icon: Egg,           number: 3  },
  { field: 'all_pesce',         label: 'Pesce',           Icon: Fish,          number: 4  },
  { field: 'all_arachidi',      label: 'Arachidi',        Icon: Nut,           number: 5  },
  { field: 'all_soia',          label: 'Soia',            Icon: Bean,          number: 6  },
  { field: 'all_latte',         label: 'Latte',           Icon: Milk,          number: 7  },
  { field: 'all_frutta_guscio', label: 'Frutta a guscio', Icon: Nut,           number: 8  },
  { field: 'all_sedano',        label: 'Sedano',          Icon: Salad,         number: 9  },
  { field: 'all_senape',        label: 'Senape',          Icon: Leaf,          number: 10 },
  { field: 'all_sesamo',        label: 'Sesamo',          Icon: Sprout,        number: 11 },
  { field: 'all_solfiti',       label: 'Solfiti',         Icon: FlaskConical,  number: 12 },
  { field: 'all_lupini',        label: 'Lupini',          Icon: Bean,          number: 13 },
  { field: 'all_molluschi',     label: 'Molluschi',       Icon: Shell,         number: 14 },
]

export const TITLE_MAX_LENGTH = 55

export const TRANSLATIONS: Array<{ lang: string; field: TranslationField; maxLength?: number }> = [
  { lang: 'Italiano', field: 'nome_it', maxLength: TITLE_MAX_LENGTH },
  { lang: 'Inglese',  field: 'nome_en', maxLength: TITLE_MAX_LENGTH },
  { lang: 'Tedesco',  field: 'nome_de', maxLength: TITLE_MAX_LENGTH },
  { lang: 'Francese', field: 'nome_fr', maxLength: TITLE_MAX_LENGTH },
]

export const CATEGORIE = [
  { label: 'Tutti i piatti', value: 'all' },
  { label: 'Antipasti',      value: 'antipasti' },
  { label: 'Primi',          value: 'primi' },
  { label: 'Secondi',        value: 'secondi' },
  { label: 'Contorni',       value: 'contorni' },
] as const
