import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCache, setCache } from '@/lib/cache'
import type { MenuVoce, Servizio, SezioneTipo } from '@/types/menuVoce'

const MAX_ALTERNATIVE = 3
const vociKey = (anno: number, mese: number, idx: 1 | 2) => `menu_voci:${anno}-${mese}-${idx}`

/** Risolve (creandolo se manca) l'id della bisettimana per anno/mese/idx. */
async function risolviBisettimanaId(anno: number, mese: number, idx: 1 | 2): Promise<string> {
  const { data, error } = await supabase
    .from('bisettimane')
    .select('id')
    .eq('anno', anno)
    .eq('mese', mese)
    .eq('bisettimana_idx', idx)
    .maybeSingle()
  if (error) throw error
  if (data) return data.id as string

  // La riga non esiste ancora: la creiamo (coerente con inserisciRigheAnno).
  const { data: created, error: insError } = await supabase
    .from('bisettimane')
    .upsert(
      { anno, mese, bisettimana_idx: idx },
      { onConflict: 'anno,mese,bisettimana_idx' },
    )
    .select('id')
    .single()
  if (insError) throw insError
  return created.id as string
}

export function useMenuComposer(anno: number, mese: number, bisettIdx: 1 | 2) {
  const [bisettimanaId, setBisettimanaId] = useState<string | null>(null)
  const [voci, setVociState] = useState<MenuVoce[]>(
    () => getCache<MenuVoce[]>(vociKey(anno, mese, bisettIdx)) ?? [],
  )
  const [loading, setLoading] = useState(
    getCache<MenuVoce[]>(vociKey(anno, mese, bisettIdx)) === undefined,
  )
  const [error, setError] = useState<string | null>(null)

  // mantiene cache e stato allineati (accetta valore o updater come useState)
  const setVoci = (next: MenuVoce[] | ((prev: MenuVoce[]) => MenuVoce[])) => {
    setVociState(prev => {
      const value = typeof next === 'function' ? (next as (p: MenuVoce[]) => MenuVoce[])(prev) : next
      setCache(vociKey(anno, mese, bisettIdx), value)
      return value
    })
  }

  useEffect(() => {
    let cancelled = false
    setError(null)
    // stale-while-revalidate: se in cache mostra subito, altrimenti loading
    const cached = getCache<MenuVoce[]>(vociKey(anno, mese, bisettIdx))
    if (cached) { setVociState(cached); setLoading(false) }
    else setLoading(true)
    ;(async () => {
      try {
        const id = await risolviBisettimanaId(anno, mese, bisettIdx)
        if (cancelled) return
        setBisettimanaId(id)
        const { data, error: vErr } = await supabase
          .from('menu_voci')
          .select('*')
          .eq('bisettimana_id', id)
          .order('posizione')
        if (cancelled) return
        if (vErr) setError(vErr.message)
        else {
          const rows = (data ?? []) as MenuVoce[]
          setCache(vociKey(anno, mese, bisettIdx), rows)
          setVociState(rows)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Errore di caricamento del menù')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [anno, mese, bisettIdx])

  /** Aggiunge un'alternativa nella cella; usa il primo slot libero (max 3). */
  const aggiungiPiatto = useCallback(async (
    giorno: number,
    servizio: Servizio,
    tipo: SezioneTipo,
    piattoId: number,
  ) => {
    if (!bisettimanaId) return
    const occupate = voci
      .filter(v => v.giorno === giorno && v.servizio === servizio && v.tipo === tipo)
      .map(v => v.posizione)
    if (occupate.length >= MAX_ALTERNATIVE) {
      setError('Massimo 3 alternative per cella.')
      return
    }
    let posizione = 0
    while (occupate.includes(posizione)) posizione++

    const { data, error: insErr } = await supabase
      .from('menu_voci')
      .insert({ bisettimana_id: bisettimanaId, giorno, servizio, tipo, piatto_id: piattoId, posizione })
      .select('*')
      .single()
    if (insErr) { setError(insErr.message); return }
    setVoci(prev => [...prev, data as MenuVoce])
  }, [bisettimanaId, voci])

  /** Assegna (piattoId) o rimuove (null) il contorno di un secondo. */
  const setContorno = useCallback(async (secondoVoceId: number, piattoId: number | null) => {
    const { data, error: updErr } = await supabase
      .from('menu_voci')
      .update({ contorno_id: piattoId })
      .eq('id', secondoVoceId)
      .select('*')
      .single()
    if (updErr) { setError(updErr.message); return }
    setVoci(prev => prev.map(v => v.id === secondoVoceId ? data as MenuVoce : v))
  }, [])

  /** Rimuove un'alternativa. */
  const rimuoviPiatto = useCallback(async (voceId: number) => {
    const { error: delErr } = await supabase.from('menu_voci').delete().eq('id', voceId)
    if (delErr) { setError(delErr.message); return }
    setVoci(prev => prev.filter(v => v.id !== voceId))
  }, [])

  return { bisettimanaId, voci, loading, error, aggiungiPiatto, setContorno, rimuoviPiatto }
}
