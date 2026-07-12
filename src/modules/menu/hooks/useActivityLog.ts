import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/core/lib/supabase'
import type { ActivityLog } from '@/modules/menu/types/activityLog'

/** Quante righe caricare per pagina (audit read-only, admin-only). */
export const AUDIT_PAGE_SIZE = 50

interface UseActivityLogResult {
  righe: ActivityLog[]
  loading: boolean
  error: string | null
  /** true finché il server potrebbe avere altre righe oltre a quelle caricate. */
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

/**
 * Legge l'audit trail (activity_log) con paginazione "carica altri".
 * Niente cache di sessione: i log devono essere freschi ad ogni apertura.
 * La RLS espone le righe solo agli admin (migrazione 017): per gli altri
 * ruoli la query torna semplicemente vuota.
 */
export function useActivityLog(): UseActivityLogResult {
  const [righe, setRighe] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  // incrementato da loadMore/refresh per ri-lanciare l'effetto di fetch
  const [page, setPage] = useState(0)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    const to = (page + 1) * AUDIT_PAGE_SIZE - 1
    // loading viene alzato negli handler (loadMore/refresh) e all'init, non
    // qui: evita setState sincrono nel body dell'effetto (cascading renders)
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, to)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Errore lettura activity_log:', error)
          setError(error.message)
        } else {
          const rows = (data ?? []) as ActivityLog[]
          setRighe(rows)
          setHasMore(rows.length === to + 1)
          setError(null)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, nonce])

  const loadMore = useCallback(() => { setLoading(true); setPage(p => p + 1) }, [])
  const refresh = useCallback(() => { setLoading(true); setPage(0); setNonce(n => n + 1) }, [])

  return { righe, loading, error, hasMore, loadMore, refresh }
}
