import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'

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

const ANNI_KEY = 'bisettimane:anni'
const bisKey = (anno: number) => `bisettimane:${anno}`

export function useBisettimane(anno: number) {
  const [bisettimane, setBisettimane] = useState<Bisettimana[]>(
    () => getCache<Bisettimana[]>(bisKey(anno)) ?? [],
  )
  const [anniEsistenti, setAnniEsistenti] = useState<Set<number>>(
    () => new Set(getCache<number[]>(ANNI_KEY) ?? []),
  )
  const [loading, setLoading] = useState(getCache<Bisettimana[]>(bisKey(anno)) === undefined)
  const [operazione, setOperazione] = useState<TipoOperazione>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    // stale-while-revalidate: se l'anno è in cache mostralo subito, altrimenti loading
    const cached = getCache<Bisettimana[]>(bisKey(anno))
    if (cached) { setBisettimane(cached); setLoading(false) }
    else setLoading(true)
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
      if (anniData) {
        const anni = [...new Set(anniData.map((r: { anno: number }) => r.anno))]
        setCache(ANNI_KEY, anni)
        setAnniEsistenti(new Set(anni))
      }
      if (bisError) setError(bisError.message)
      else {
        const rows = bisData ?? []
        setCache(bisKey(anno), rows)
        setBisettimane(rows)
      }
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

  // forza una rivalidazione (es. dopo una duplica settimana)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  const mappa = useMemo(() => {
    const m = new Map<string, Bisettimana>()
    for (const b of bisettimane) m.set(`${b.mese}-${b.bisettimana_idx}`, b)
    return m
  }, [bisettimane])

  const maxAnnoEsistente = anniEsistenti.size > 0 ? Math.max(...anniEsistenti) : null

  return {
    bisettimane, mappa, anniEsistenti, maxAnnoEsistente,
    loading, operazione, inizializzaAnno, copiaAnno, refresh, error,
  }
}
