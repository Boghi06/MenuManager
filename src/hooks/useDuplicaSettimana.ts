import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { clearCache } from '@/lib/cache'
import type { MenuVoce } from '@/types/menuVoce'

/** Riferimento a una settimana (7 giorni) all'interno di una bisettimana. */
export interface SettimanaRef {
  anno: number
  mese: number
  idx: 1 | 2
  settimana: 1 | 2  // 1 = giorni 0–6, 2 = giorni 7–13
}

export type DuplicaEsito =
  | { status: 'done'; copiate: number }
  | { status: 'empty' }                          // la sorgente non ha voci
  | { status: 'needs-confirm'; vociDestinazione: number }  // destinazione già compilata

/** Offset del primo giorno di una settimana (0 o 7). */
const offsetSettimana = (s: 1 | 2) => (s - 1) * 7

/** Risolve (creandola se manca) la bisettimana per anno/mese/idx. */
async function risolviBisettimanaId(anno: number, mese: number, idx: 1 | 2): Promise<string> {
  const { data, error } = await supabase
    .from('bisettimane')
    .select('id')
    .eq('anno', anno).eq('mese', mese).eq('bisettimana_idx', idx)
    .maybeSingle()
  if (error) throw error
  if (data) return data.id as string

  const { data: created, error: insErr } = await supabase
    .from('bisettimane')
    .upsert({ anno, mese, bisettimana_idx: idx }, { onConflict: 'anno,mese,bisettimana_idx' })
    .select('id').single()
  if (insErr) throw insErr
  return created.id as string
}

/** Carica le voci di una settimana (giorni offset..offset+6) di una bisettimana. */
async function vociSettimana(bisettimanaId: string, settimana: 1 | 2): Promise<MenuVoce[]> {
  const off = offsetSettimana(settimana)
  const { data, error } = await supabase
    .from('menu_voci')
    .select('*')
    .eq('bisettimana_id', bisettimanaId)
    .gte('giorno', off)
    .lte('giorno', off + 6)
  if (error) throw error
  return (data ?? []) as MenuVoce[]
}

export function useDuplicaSettimana() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Duplica la settimana `sorgente` nella settimana `destinazione`.
   * - Se la sorgente è vuota → { status: 'empty' } (no-op).
   * - Se la destinazione contiene già voci e `force` è false → { status: 'needs-confirm' }.
   * - Altrimenti svuota la settimana di destinazione e vi copia la sorgente.
   */
  const duplica = useCallback(async (
    sorgente: SettimanaRef,
    destinazione: SettimanaRef,
    force = false,
  ): Promise<DuplicaEsito> => {
    setLoading(true)
    setError(null)
    try {
      const srcId = await risolviBisettimanaId(sorgente.anno, sorgente.mese, sorgente.idx)
      const dstId = await risolviBisettimanaId(destinazione.anno, destinazione.mese, destinazione.idx)

      const srcVoci = await vociSettimana(srcId, sorgente.settimana)
      if (srcVoci.length === 0) return { status: 'empty' }

      const dstVoci = await vociSettimana(dstId, destinazione.settimana)
      if (dstVoci.length > 0 && !force) {
        return { status: 'needs-confirm', vociDestinazione: dstVoci.length }
      }

      const srcOff = offsetSettimana(sorgente.settimana)
      const dstOff = offsetSettimana(destinazione.settimana)

      // svuota la settimana di destinazione
      if (dstVoci.length > 0) {
        const { error: delErr } = await supabase
          .from('menu_voci')
          .delete()
          .in('id', dstVoci.map(v => v.id))
        if (delErr) throw delErr
      }

      // copia le voci rimappando il giorno nella settimana di destinazione
      const nuove = srcVoci.map(v => ({
        bisettimana_id: dstId,
        giorno: dstOff + (v.giorno - srcOff),
        servizio: v.servizio,
        tipo: v.tipo,
        piatto_id: v.piatto_id,
        contorno_id: v.contorno_id,
        posizione: v.posizione,
      }))
      const { error: insErr } = await supabase.from('menu_voci').insert(nuove)
      if (insErr) throw insErr

      // invalida le cache toccate (stato bisettimane + voci della destinazione)
      clearCache(`bisettimane:${destinazione.anno}`)
      clearCache(`menu_voci:${destinazione.anno}-${destinazione.mese}-${destinazione.idx}`)

      return { status: 'done', copiate: nuove.length }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore durante la duplicazione'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { duplica, loading, error }
}
