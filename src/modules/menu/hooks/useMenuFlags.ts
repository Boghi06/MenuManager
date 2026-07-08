import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/core/lib/supabase'
import type { FlagKey, MenuFlag, Servizio } from '@/modules/menu/types/menuVoce'

const mk = (giorno: number, servizio: Servizio) => `${giorno}:${servizio}`

export function useMenuFlags(bisettimanaId: string | null) {
  // Map<"giorno:servizio", MenuFlag> → lookup O(1) invece di find() O(n)
  const [flagsMap, setFlagsMap] = useState<Map<string, MenuFlag>>(new Map())

  useEffect(() => {
    if (!bisettimanaId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('menu_flags')
        .select('*')
        .eq('bisettimana_id', bisettimanaId)
      if (cancelled || !data) return
      const m = new Map<string, MenuFlag>()
      for (const f of data as MenuFlag[]) m.set(mk(f.giorno, f.servizio), f)
      setFlagsMap(m)
    })()
    return () => { cancelled = true }
  }, [bisettimanaId])

  const applyUpdate = useCallback((flag: MenuFlag) => {
    setFlagsMap(prev => {
      const next = new Map(prev)
      next.set(mk(flag.giorno, flag.servizio), flag)
      return next
    })
  }, [])

  const getFlag = useCallback(
    (giorno: number, servizio: Servizio, key: FlagKey): boolean =>
      flagsMap.get(mk(giorno, servizio))?.[key] ?? true,
    [flagsMap],
  )

  const toggleFlag = useCallback(
    async (giorno: number, servizio: Servizio, key: FlagKey) => {
      if (!bisettimanaId) return
      const current = flagsMap.get(mk(giorno, servizio))
      const newValue = !(current?.[key] ?? true)
      const { data } = await supabase
        .from('menu_flags')
        .upsert(
          { bisettimana_id: bisettimanaId, giorno, servizio, [key]: newValue },
          { onConflict: 'bisettimana_id,giorno,servizio' },
        )
        .select('*')
        .single()
      if (data) applyUpdate(data as MenuFlag)
    },
    [bisettimanaId, flagsMap, applyUpdate],
  )

  const getEvento = useCallback(
    (giorno: number, servizio: Servizio): string | null =>
      flagsMap.get(mk(giorno, servizio))?.evento_id ?? null,
    [flagsMap],
  )

  const setEvento = useCallback(
    async (giorno: number, servizio: Servizio, eventoId: string | null) => {
      if (!bisettimanaId) return
      const { data } = await supabase
        .from('menu_flags')
        .upsert(
          { bisettimana_id: bisettimanaId, giorno, servizio, evento_id: eventoId },
          { onConflict: 'bisettimana_id,giorno,servizio' },
        )
        .select('*')
        .single()
      if (data) applyUpdate(data as MenuFlag)
    },
    [bisettimanaId, applyUpdate],
  )

  return { getFlag, toggleFlag, getEvento, setEvento }
}
