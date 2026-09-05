/**
 * Categoria merceologica del piatto: asse indipendente dalla portata
 * (`tipo`). Determina il colore della barra verticale del piatto in UI.
 */
export type CategoriaPiatto = 'carne' | 'pesce' | 'vegetariano'

export interface Piatto {
  id: number
  nome_it: string
  nome_en: string | null
  nome_fr: string | null
  nome_de: string | null
  /** Portata principale: coincide sempre con `tipi[0]` (trigger DB, 026). */
  tipo: string | null
  /** Tutte le portate del piatto: un piatto può stare in più sezioni. */
  tipi: string[]
  /** null = non specificata: barra grigia come prima dell'introduzione del campo. */
  categoria: CategoriaPiatto | null
  vegetariano: boolean
  vegano: boolean
  no_lattosio: boolean
  locale: boolean
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
