import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TIPO_TO_CODE } from '@/constants/piatti'
import type { Piatto, PiattoForm } from '@/types/piatto'

export function usePiatti() {
  const [piatti, setPiatti] = useState<Piatto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
    const { error } = await supabase.from('piatti').insert({ id: newId, ...toDbForm(form) })
    if (error) {
      console.error('Errore inserimento:', error)
      return error.message
    }
    const { data: fresh } = await supabase.from('piatti').select('*').order('id')
    if (fresh) setPiatti(fresh as Piatto[])
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
