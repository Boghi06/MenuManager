/** Servizio di un menù. */
export type Servizio = 'pranzo' | 'cena'

/** Sezione (tipo) di una riga della griglia composizione. Il contorno non è una sezione. */
export type SezioneTipo = 'ant' | 'pr' | 'se' | 'des'

/**
 * Una voce di menù = un'alternativa in una cella
 * (bisettimana, giorno 0–13, servizio, sezione/tipo, posizione 0–2).
 * Il contorno è un attributo OPZIONALE del secondo: `contorno_id` (0 o 1).
 */
export interface MenuVoce {
  id: number
  bisettimana_id: string
  giorno: number          // 0=Lun sett.1 … 13=Dom sett.2
  servizio: Servizio
  tipo: SezioneTipo
  piatto_id: number
  contorno_id: number | null  // solo secondi; nullable
  posizione: number           // 0–2
}
