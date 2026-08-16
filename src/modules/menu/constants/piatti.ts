import {
  Salad, Leaf, MilkOff, ChefHat,
  Nut, Shell, Wheat, Egg, Milk, Fish, Bean, Sprout, FlaskConical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { clientConfig } from '@/config/clients'
import type { PiattoForm, TranslationField } from '@/modules/menu/types/piatto'

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

// Abbreviazioni per la colonna "tipo" della stampa ricette, larga 34px:
// le parole intere ci andrebbero a capo. Solo presentazione, mai valori salvati.
export const TIPO_ABBR: Record<string, string> = {
  antipasti: 'ant', primi: 'pr', secondi: 'se', contorni: 'con',
}

// righe (sezioni) della griglia composizione — il contorno NON è una riga
export const SEZIONI_ORDER = ['antipasti', 'primi', 'secondi'] as const

// numero massimo di alternative per sezione: 1 antipasto, 3 primi, 3 secondi
export const SEZIONI_MAX: Record<string, number> = {
  antipasti: 1, primi: 3, secondi: 3,
}

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

export const EMPTY_FORM: PiattoForm = {
  nome_it: '', nome_en: '', nome_fr: '', nome_de: '',
  tipo: 'primi', ricetta: '',
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
