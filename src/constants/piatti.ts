import {
  Salad, Leaf, MilkOff, ChefHat,
  Nut, Shell, Wheat, Egg, Milk, Fish, Bean, Sprout, FlaskConical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PiattoForm, TranslationField } from '@/types/piatto'

export const TIPO_LABEL: Record<string, string> = {
  pr: 'Primo', se: 'Secondo', con: 'Contorno', des: 'Dessert',
}

export const TIPO_TO_CODE: Record<string, string> = {
  primo: 'pr', secondo: 'se', contorno: 'con', dessert: 'des',
}

export const CODE_TO_TIPO: Record<string, string> = {
  pr: 'primo', se: 'secondo', con: 'contorno', des: 'dessert',
}

export const EMPTY_FORM: PiattoForm = {
  nome_it: '', nome_en: '', nome_fr: '', nome_de: '',
  tipo: 'primo', ricetta: '',
  vegetariano: false, vegano: false, no_lattosio: false, KM0: false,
  all_glutine: false, all_crostacei: false, all_uova: false, all_pesce: false,
  all_arachidi: false, all_soia: false, all_latte: false, all_frutta_guscio: false,
  all_sedano: false, all_senape: false, all_sesamo: false, all_solfiti: false,
  all_lupini: false, all_molluschi: false,
}

export interface CaratteristicaConfig {
  field: keyof PiattoForm
  label: string
  Icon: LucideIcon
  badgeClass: string
}

export interface AllergenoConfig {
  field: keyof PiattoForm
  label: string
  Icon: LucideIcon
}

export const CARATTERISTICHE: CaratteristicaConfig[] = [
  { field: 'vegetariano', label: 'Vegetariano',   Icon: Salad,   badgeClass: 'bg-green-100 text-green-700' },
  { field: 'vegano',      label: 'Vegano',         Icon: Leaf,    badgeClass: 'bg-green-100 text-green-700' },
  { field: 'no_lattosio', label: 'Senza lattosio', Icon: MilkOff, badgeClass: 'bg-blue-100 text-blue-700' },
  { field: 'KM0',   label: 'KM0',      Icon: ChefHat, badgeClass: 'bg-amber-100 text-amber-700' },
]

export const ALLERGENI: AllergenoConfig[] = [
  { field: 'all_arachidi',      label: 'Arachidi',        Icon: Nut },
  { field: 'all_crostacei',     label: 'Crostacei',       Icon: Shell },
  { field: 'all_frutta_guscio', label: 'Frutta a guscio', Icon: Nut },
  { field: 'all_glutine',       label: 'Glutine',         Icon: Wheat },
  { field: 'all_latte',         label: 'Latte',           Icon: Milk },
  { field: 'all_lupini',        label: 'Lupini',          Icon: Bean },
  { field: 'all_molluschi',     label: 'Molluschi',       Icon: Shell },
  { field: 'all_pesce',         label: 'Pesce',           Icon: Fish },
  { field: 'all_sedano',        label: 'Sedano',          Icon: Salad },
  { field: 'all_senape',        label: 'Senape',          Icon: Leaf },
  { field: 'all_sesamo',        label: 'Sesamo',          Icon: Sprout },
  { field: 'all_solfiti',       label: 'Solfiti',         Icon: FlaskConical },
  { field: 'all_soia',          label: 'Soia',            Icon: Bean },
  { field: 'all_uova',          label: 'Uova',            Icon: Egg },
]

export const TITLE_MAX_LENGTH = 55

export const TRANSLATIONS: Array<{ lang: string; field: TranslationField; maxLength?: number }> = [
  { lang: 'Italiano', field: 'nome_it', maxLength: TITLE_MAX_LENGTH },
  { lang: 'Inglese',  field: 'nome_en' },
  { lang: 'Tedesco',  field: 'nome_de' },
  { lang: 'Francese', field: 'nome_fr' },
]

export const CATEGORIE = [
  { label: 'Tutti i piatti', value: 'all' },
  { label: 'Primi',          value: 'pr' },
  { label: 'Secondi',        value: 'se' },
  { label: 'Contorni',       value: 'con' },
  { label: 'Dessert',        value: 'des' },
] as const
