export interface Evento {
  id: string
  nome: string
  sottotitolo?: string | null
  immagine_url?: string | null
  ordine?: number
  created_at?: string
  /** Quanti slot menu_flags puntano a questo evento (da view eventi_with_usi). */
  usi: number
  /** Data dell'ultimo slot che lo usa (null se mai assegnato). */
  ultimo_uso: string | null
}
