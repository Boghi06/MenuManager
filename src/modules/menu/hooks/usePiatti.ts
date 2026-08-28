import { useState, useEffect } from 'react'
import { supabase } from '@/core/lib/supabase'
import { getCache, setCache } from '@/core/lib/cache'
import type { Piatto, PiattoForm } from '@/modules/menu/types/piatto'

const CACHE_KEY = 'piatti'

// PostgREST tronca ogni select a `db-max-rows` (1000 di default su Supabase)
// e lo fa in silenzio, senza errore: con il catalogo a ~4.850 piatti l'elenco
// mostrava i primi 1000 come se fossero tutti. Quindi si scorre a pagine.
const PAGINA = 1000

/**
 * Scarica l'intero catalogo piatti pagina per pagina.
 *
 * L'avanzamento segue quante righe sono davvero arrivate, non `PAGINA`: se il
 * progetto avesse un `db-max-rows` più basso di così, fermarsi alla prima
 * pagina "corta" perderebbe silenziosamente il resto del catalogo. Si esce
 * solo su una pagina vuota, che costa una richiesta in più ed è l'unica
 * condizione vera di fine.
 */
async function scaricaTuttiIPiatti(): Promise<Piatto[]> {
  const tutti: Piatto[] = []
  for (;;) {
    const { data, error } = await supabase
      .from('piatti')
      .select('*')
      .order('id')
      .range(tutti.length, tutti.length + PAGINA - 1)
    if (error) throw new Error(error.message)
    const pagina = (data ?? []) as Piatto[]
    tutti.push(...pagina)
    if (pagina.length === 0) return tutti
  }
}

export function usePiatti() {
  const cached = getCache<Piatto[]>(CACHE_KEY)
  const [piatti, setPiattiState] = useState<Piatto[]>(cached ?? [])
  // se abbiamo già i dati in cache mostriamoli subito: niente flash di caricamento
  const [loading, setLoading] = useState(cached === undefined)
  const [error, setError] = useState<string | null>(null)

  // mantiene cache e stato sempre allineati (accetta valore o updater come useState)
  const setPiatti = (next: Piatto[] | ((prev: Piatto[]) => Piatto[])) => {
    setPiattiState(prev => {
      const value = typeof next === 'function' ? (next as (p: Piatto[]) => Piatto[])(prev) : next
      setCache(CACHE_KEY, value)
      return value
    })
  }

  useEffect(() => {
    // revalidate in background (stale-while-revalidate)
    scaricaTuttiIPiatti()
      .then(setPiatti)
      .catch((e: Error) => {
        console.error('Supabase fetch error:', e)
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const createPiatto = async (form: PiattoForm): Promise<string | null> => {
    const newId = piatti.length > 0 ? Math.max(...piatti.map(p => p.id)) + 1 : 1
    const { data, error } = await supabase
      .from('piatti')
      .insert({ id: newId, ...form })
      .select('*')
      .single()
    if (error) {
      console.error('Errore inserimento:', error)
      return error.message
    }
    if (data) setPiatti(prev => [...prev, data as Piatto].sort((a, b) => a.id - b.id))
    return null
  }

  const updatePiatto = async (id: number, form: PiattoForm): Promise<boolean> => {
    const { data, error } = await supabase
      .from('piatti')
      .update(form)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Errore salvataggio:', error)
      return false
    }
    if (data) setPiatti(prev => prev.map(p => p.id === id ? data as Piatto : p))
    return true
  }

  const deletePiatto = async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('piatti').delete().eq('id', id)
    if (error) {
      console.error('Errore eliminazione:', error)
      return false
    }
    setPiatti(prev => prev.filter(p => p.id !== id))
    return true
  }

  return { piatti, loading, error, createPiatto, updatePiatto, deletePiatto }
}
