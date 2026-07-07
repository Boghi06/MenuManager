import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/core/ui/sheet'
import { Input } from '@/core/ui/input'
import { usePiatti } from '@/hooks/usePiatti'
import { TIPO_BAR, TIPO_LABEL } from '@/constants/piatti'

interface SelettorePiattoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Codice tipo da filtrare nella libreria (ant|pr|se|con|des). */
  filtroTipo: string
  onPick: (piattoId: number) => void
}

export function SelettorePiatto({ open, onOpenChange, filtroTipo, onPick }: SelettorePiattoProps) {
  const { piatti, loading } = usePiatti()
  const [query, setQuery] = useState('')

  const label = TIPO_LABEL[filtroTipo] ?? 'piatto'

  const risultati = useMemo(() => {
    const q = query.trim().toLowerCase()
    return piatti
      .filter(p => p.tipo === filtroTipo)
      .filter(p => !q || p.nome_it.toLowerCase().includes(q) || String(p.id).includes(q))
  }, [piatti, filtroTipo, query])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full p-0 flex flex-col"
        style={{ width: '34rem', maxWidth: '34rem' }}
      >
        <SheetHeader className="p-6 border-b border-gray-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Aggiungi {label.toLowerCase()}
          </p>
          <SheetTitle className="font-fraunces text-2xl font-light text-black">
            Seleziona dalla libreria
          </SheetTitle>
          <SheetDescription className="sr-only">
            Scegli un {label.toLowerCase()} dalla libreria piatti
          </SheetDescription>
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome o ID…"
              className="pl-8 text-sm"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-6 py-8 text-sm text-gray-400">Caricamento…</div>
          ) : risultati.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-400">Nessun {label.toLowerCase()} trovato.</div>
          ) : (
            risultati.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onPick(p.id); onOpenChange(false) }}
                className="w-full flex items-center gap-3 px-6 py-3 border-b border-[#F4F4F4]
                           text-left transition-colors hover:bg-gray-50"
              >
                <div
                  className="shrink-0 rounded-sm"
                  style={{ width: 4, height: 28, background: TIPO_BAR[filtroTipo] ?? '#000000' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-fraunces text-base text-black truncate">{p.nome_it}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">#{p.id}</div>
                </div>
                <span className="text-xs text-gray-500 shrink-0">+ Aggiungi</span>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
