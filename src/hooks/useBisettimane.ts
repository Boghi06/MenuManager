import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type StatoBisettimana = 'full' | 'partial' | 'empty'
export type TipoOperazione = 'inizializza' | 'copia' | null

export interface Bisettimana {
  id: string
  anno: number
  mese: number
  bisettimana_idx: 1 | 2
  stato: StatoBisettimana
}

async function inserisciRigheAnno(anno: number) {
  const rows: { anno: number; mese: number; bisettimana_idx: number }[] = []
  for (let mese = 1; mese <= 12; mese++) {
    rows.push({ anno, mese, bisettimana_idx: 1 })
    rows.push({ anno, mese, bisettimana_idx: 2 })
  }
  const { error } = await supabase
    .from('bisettimane')
    .upsert(rows, { onConflict: 'anno,mese,bisettimana_idx' })
  if (error) throw error
}

export function useBisettimane(anno: number) {
  const [bisettimane, setBisettimane] = useState<Bisettimana[]>([])
  const [anniEsistenti, setAnniEsistenti] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [operazione, setOperazione] = useState<TipoOperazione>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [{ data: anniData }, { data: bisData, error: bisError }] = await Promise.all([
        supabase.from('bisettimane').select('anno'),
        supabase
          .from('bisettimane_with_stato')
          .select('*')
          .eq('anno', anno)
          .order('mese')
          .order('bisettimana_idx'),
      ])
      if (cancelled) return
      if (anniData) setAnniEsistenti(new Set(anniData.map((r: { anno: number }) => r.anno)))
      if (bisError) setError(bisError.message)
      else setBisettimane(bisData ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [anno, refreshKey])

  // Auto-inizializza l'anno corrente al primo avvio
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    ;(async () => {
      const { data } = await supabase
        .from('bisettimane')
        .select('anno')
        .eq('anno', currentYear)
        .limit(1)
      if ((data ?? []).length === 0) {
        await inserisciRigheAnno(currentYear)
        setRefreshKey(k => k + 1)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const inizializzaAnno = useCallback(async (a: number) => {
    setOperazione('inizializza')
    setError(null)
    try {
      await inserisciRigheAnno(a)
      setRefreshKey(k => k + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante l\'inizializzazione')
    } finally {
      setOperazione(null)
    }
  }, [])

  // Copia le bisettimane da annoDa ad annoA.
  // Al momento crea solo le 24 righe strutturali; quando menu_giorno
  // sarà implementato nel prossimo handoff, questa funzione copierà
  // anche il contenuto dei menu.
  const copiaAnno = useCallback(async (annoDa: number, annoA: number) => {
    setOperazione('copia')
    setError(null)
    try {
      await inserisciRigheAnno(annoA)
      // TODO: copiare anche menu_giorno da annoDa a annoA
      void annoDa
      setRefreshKey(k => k + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante la copia')
    } finally {
      setOperazione(null)
    }
  }, [])

  const mappa = new Map<string, Bisettimana>()
  for (const b of bisettimane) mappa.set(`${b.mese}-${b.bisettimana_idx}`, b)

  const maxAnnoEsistente = anniEsistenti.size > 0 ? Math.max(...anniEsistenti) : null

  return {
    bisettimane, mappa, anniEsistenti, maxAnnoEsistente,
    loading, operazione, inizializzaAnno, copiaAnno, error,
  }
}
