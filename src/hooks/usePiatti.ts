import { useState, useEffect } from 'react'
import { supabase } from '@/core/lib/supabase'
import { getCache, setCache } from '@/core/lib/cache'
import { TIPO_TO_CODE } from '@/constants/piatti'
import type { Piatto, PiattoForm } from '@/types/piatto'

const CACHE_KEY = 'piatti'

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
    supabase.from('piatti').select('*').order('id').then(({ data, error }) => {
      if (error) {
        console.error('Supabase fetch error:', error)
        setError(error.message)
      } else {
        setPiatti((data ?? []) as Piatto[])
      }
      setLoading(false)
    })
  }, [])

  const toDbForm = (form: PiattoForm) => ({
    ...form,
    tipo: TIPO_TO_CODE[form.tipo ?? ''] ?? form.tipo,
  })

  const createPiatto = async (form: PiattoForm): Promise<string | null> => {
    const newId = piatti.length > 0 ? Math.max(...piatti.map(p => p.id)) + 1 : 1
    const { data, error } = await supabase
      .from('piatti')
      .insert({ id: newId, ...toDbForm(form) })
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
      .update(toDbForm(form))
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
