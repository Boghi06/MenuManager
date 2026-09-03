import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/core/lib/supabase'
import { MESI } from '@/modules/menu/constants/mesi'
import { idsPiattiCitati } from '@/modules/menu/lib/audit'
import type { AuditContext } from '@/modules/menu/lib/audit'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

/**
 * Risolve gli id che compaiono negli snapshot dell'audit in nomi leggibili.
 *
 * `menu_voci` salva solo `piatto_id`/`contorno_id` e l'uuid della bisettimana:
 * senza questa risoluzione il registro mostrerebbe numeri. I nomi si chiedono
 * SOLO per gli id davvero citati dalle righe caricate (poche decine), non
 * scaricando le ~4.800 righe del catalogo: la pagina non ne ha bisogno d'altro.
 *
 * Ritorna il contesto da passare alle funzioni di `lib/audit`. La sua identità
 * cambia quando arrivano nuovi nomi, così i `useMemo` che ne dipendono si
 * ricalcolano da soli invece di restare fermi agli id grezzi.
 */
export function useAuditLookups(righe: ActivityLog[]): AuditContext {
  const [nomiPiatti, setNomiPiatti] = useState<Map<number, string>>(() => new Map())
  const [labelBisettimane, setLabelBisettimane] = useState<Map<string, string>>(() => new Map())
  // id già richiesti: evita di rifare la stessa fetch mentre è ancora in volo
  const richiestiRef = useRef<Set<number>>(new Set())

  // ── bisettimane: tabella piccola (24 righe per anno), si carica in blocco ──
  useEffect(() => {
    let cancelled = false
    supabase
      .from('bisettimane')
      .select('id, anno, mese, bisettimana_idx')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const m = new Map<string, string>()
        for (const b of data as Array<{ id: string; anno: number; mese: number; bisettimana_idx: number }>) {
          m.set(b.id, `${MESI[b.mese - 1]} ${b.anno} · ${b.bisettimana_idx === 1 ? 'A' : 'B'}`)
        }
        setLabelBisettimane(m)
      })
    return () => { cancelled = true }
  }, [])

  // ── piatti: solo gli id nuovi comparsi nelle righe di log ──────────────────
  useEffect(() => {
    const mancanti = idsPiattiCitati(righe).filter(id => !richiestiRef.current.has(id))
    if (mancanti.length === 0) return
    let cancelled = false
    for (const id of mancanti) richiestiRef.current.add(id)
    supabase
      .from('piatti')
      .select('id, nome_it')
      .in('id', mancanti)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        setNomiPiatti(prev => {
          const next = new Map(prev)
          for (const p of data as Array<{ id: number; nome_it: string }>) next.set(p.id, p.nome_it)
          return next
        })
      })
    return () => { cancelled = true }
  }, [righe])

  return useMemo(() => ({
    nomePiatto: (id: number) => nomiPiatti.get(id),
    labelBisettimana: (id: string) => labelBisettimane.get(id),
  }), [nomiPiatti, labelBisettimane])
}
