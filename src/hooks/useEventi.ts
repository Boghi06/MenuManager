import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Evento } from '@/types/evento'

/** Ricava il path nel bucket da una public URL (…/eventi-images/<path>). */
function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = '/eventi-images/'
  const i = url.indexOf(marker)
  return i >= 0 ? url.slice(i + marker.length) : null
}

export function useEventi() {
  const [eventi, setEventi] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('eventi_with_usi').select('*')
      if (!cancelled && data) setEventi(data as Evento[])
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  /** Carica un file nel bucket e ritorna la public URL (chiamare solo al salvataggio). */
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('eventi-images').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('eventi-images').getPublicUrl(path)
    return data.publicUrl
  }, [])

  const createEvento = useCallback(
    async (nome: string, sottotitolo: string | null, immagine_url: string | null): Promise<Evento | null> => {
      const { data, error } = await supabase
        .from('eventi')
        .insert({ nome, sottotitolo: sottotitolo || null, immagine_url })
        .select('*')
        .single()
      if (error || !data) return null
      const e: Evento = { ...(data as Evento), usi: 0, ultimo_uso: null }
      setEventi(prev => [...prev, e])
      return e
    },
    [],
  )

  const updateEvento = useCallback(
    async (id: string, nome: string, sottotitolo: string | null, immagine_url: string | null): Promise<boolean> => {
      const { data, error } = await supabase
        .from('eventi')
        .update({ nome, sottotitolo: sottotitolo || null, immagine_url })
        .eq('id', id)
        .select('*')
        .single()
      if (error || !data) return false
      setEventi(prev =>
        prev.map(e => (e.id === id ? { ...(data as Evento), usi: e.usi, ultimo_uso: e.ultimo_uso } : e)),
      )
      return true
    },
    [],
  )

  /** Elimina l'evento e, se l'immagine non è condivisa con altri eventi, anche il file. */
  const deleteEvento = useCallback(
    async (evento: Evento): Promise<boolean> => {
      const { error } = await supabase.from('eventi').delete().eq('id', evento.id)
      if (error) return false

      const path = pathFromUrl(evento.immagine_url)
      const sharedByOther = !!evento.immagine_url
        && eventi.some(e => e.id !== evento.id && e.immagine_url === evento.immagine_url)
      if (path && !sharedByOther) {
        await supabase.storage.from('eventi-images').remove([path])
      }

      setEventi(prev => prev.filter(e => e.id !== evento.id))
      return true
    },
    [eventi],
  )

  return { eventi, loading, uploadImage, createEvento, updateEvento, deleteEvento }
}
