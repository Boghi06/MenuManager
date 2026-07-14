import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/core/lib/supabase'
import type { FooterRiga } from '@/modules/menu/types/footerRiga'
import type { FooterSupplemento } from '@/modules/menu/types/footerSupplemento'

export interface RigaInput { piatto_id: number }
export interface SupplInput { piatto_id: number; prezzo: number }

export function useFooterConfig() {
  const [righe, setRighe] = useState<FooterRiga[]>([])
  const [supplementi, setSupplementi] = useState<FooterSupplemento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [r, s] = await Promise.all([
        supabase.from('footer_riga').select('*').order('ordine'),
        supabase.from('footer_supplemento').select('*').order('ordine'),
      ])
      if (cancelled) return
      if (r.data) setRighe(r.data as FooterRiga[])
      if (s.data) setSupplementi(s.data as FooterSupplemento[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  /**
   * Replace del footer (unico, non più per lingua): svuota e reinserisce righe +
   * supplementi. Non essendo transazionale lato client, ogni step è controllato:
   * se un insert fallisce dopo la delete si ripristinano le righe precedenti, così
   * un salvataggio andato male non lascia MAI il footer vuoto (bug: "se rimuovo i
   * piatti restano rimossi / non me li fa aggiungere"). Ritorna null se ok, oppure
   * il messaggio d'errore da mostrare in UI (convenzione hook del progetto).
   */
  const saveFooter = useCallback(
    async (nuoveRighe: RigaInput[], nuoviSuppl: SupplInput[]): Promise<string | null> => {
      setSaving(true)
      // snapshot per il rollback: le ultime righe note-buone in DB
      const prevRighe = righe.map(r => ({ ordine: r.ordine, piatto_id: r.piatto_id }))
      const prevSuppl = supplementi.map(s => ({ ordine: s.ordine, piatto_id: s.piatto_id, prezzo: s.prezzo }))
      try {
        const righeRows = nuoveRighe.map((r, i) => ({ ordine: i, piatto_id: r.piatto_id }))
        const supplRows = nuoviSuppl.map((s, i) => ({ ordine: i, piatto_id: s.piatto_id, prezzo: s.prezzo }))

        // ── footer_riga ──
        const d1 = await supabase.from('footer_riga').delete().gte('ordine', 0)
        if (d1.error) throw d1.error
        if (righeRows.length) {
          const ins = await supabase.from('footer_riga').insert(righeRows)
          // insert fallito DOPO la delete: ripristino le righe precedenti
          if (ins.error) {
            if (prevRighe.length) await supabase.from('footer_riga').insert(prevRighe)
            throw ins.error
          }
        }

        // ── footer_supplemento ──
        const d2 = await supabase.from('footer_supplemento').delete().gte('ordine', 0)
        if (d2.error) throw d2.error
        if (supplRows.length) {
          const ins = await supabase.from('footer_supplemento').insert(supplRows)
          if (ins.error) {
            if (prevSuppl.length) await supabase.from('footer_supplemento').insert(prevSuppl)
            throw ins.error
          }
        }

        const [r, s] = await Promise.all([
          supabase.from('footer_riga').select('*').order('ordine'),
          supabase.from('footer_supplemento').select('*').order('ordine'),
        ])
        setRighe((r.data as FooterRiga[]) ?? [])
        setSupplementi((s.data as FooterSupplemento[]) ?? [])
        return null
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Errore durante il salvataggio del footer'
        console.error('saveFooter:', e)
        return msg
      } finally {
        setSaving(false)
      }
    },
    [righe, supplementi],
  )

  return { righe, supplementi, loading, saving, saveFooter }
}
