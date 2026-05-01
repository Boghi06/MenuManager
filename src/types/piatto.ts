export interface Piatto {
  id: number
  nome_it: string
  nome_en: string | null
  nome_fr: string | null
  nome_de: string | null
  tipo: string | null
  vegetariano: boolean
  vegano: boolean
  no_lattosio: boolean
  km0: boolean
  ricetta: string | null
  all_glutine: boolean
  all_crostacei: boolean
  all_uova: boolean
  all_pesce: boolean
  all_arachidi: boolean
  all_soia: boolean
  all_latte: boolean
  all_frutta_guscio: boolean
  all_sedano: boolean
  all_senape: boolean
  all_sesamo: boolean
  all_solfiti: boolean
  all_lupini: boolean
  all_molluschi: boolean
}

export type PiattoForm = Omit<Piatto, 'id'>

export type TranslationField = 'nome_it' | 'nome_en' | 'nome_de' | 'nome_fr'
