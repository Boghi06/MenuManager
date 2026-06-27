import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { FooterRiga } from '@/types/footerRiga'
import type { FooterSupplemento } from '@/types/footerSupplemento'

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

  /** Replace transazionale: cancella e reinserisce righe + supplementi (footer unico, non più per lingua). */
  const saveFooter = useCallback(
    async (nuoveRighe: RigaInput[], nuoviSuppl: SupplInput[]): Promise<boolean> => {
      setSaving(true)
      try {
        const righeRows = nuoveRighe.map((r, i) => ({ ordine: i, piatto_id: r.piatto_id }))

        const supplRows = nuoviSuppl.map((s, i) => ({ ordine: i, piatto_id: s.piatto_id, prezzo: s.prezzo }))

        const d1 = await supabase.from('footer_riga').delete().gte('ordine', 0)
        if (d1.error) return false
        if (righeRows.length) {
          const ins = await supabase.from('footer_riga').insert(righeRows)
          if (ins.error) return false
        }

        const d2 = await supabase.from('footer_supplemento').delete().gte('ordine', 0)
        if (d2.error) return false
        if (supplRows.length) {
          const ins = await supabase.from('footer_supplemento').insert(supplRows)
          if (ins.error) return false
        }

        const [r, s] = await Promise.all([
          supabase.from('footer_riga').select('*').order('ordine'),
          supabase.from('footer_supplemento').select('*').order('ordine'),
        ])
        setRighe((r.data as FooterRiga[]) ?? [])
        setSupplementi((s.data as FooterSupplemento[]) ?? [])
        return true
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return { righe, supplementi, loading, saving, saveFooter }
}
