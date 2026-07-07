import { useState, useMemo, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/core/ui/input'
import { COLORS } from '@/constants'
import { usePiatti } from '@/modules/menu/hooks/usePiatti'
import { AppLayout } from '@/core/layout/AppLayout'
import { PiattoCard } from '@/modules/menu/components/piatti/PiattoCard'
import { CategorieNav } from '@/modules/menu/components/piatti/CategorieNav'
import { PiattoDrawerView } from '@/modules/menu/components/piatti/PiattoDrawerView'
import { PiattoDrawerEdit } from '@/modules/menu/components/piatti/PiattoDrawerEdit'
import { PiattoDrawerNew } from '@/modules/menu/components/piatti/PiattoDrawerNew'
import { ConfirmDeleteDialog } from '@/core/components/ConfirmDeleteDialog'
import type { Piatto } from '@/modules/menu/types/piatto'

export default function Dashboard() {
  const { piatti, loading, error, createPiatto, updatePiatto, deletePiatto } = usePiatti()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const [viewPiatto, setViewPiatto] = useState<Piatto | null>(null)
  const [editPiatto, setEditPiatto] = useState<Piatto | null>(null)
  const [nuovoOpen, setNuovoOpen] = useState(false)
  const [eliminaId, setEliminaId] = useState<number | null>(null)

  const counts = useMemo(() => ({
    all: piatti.length,
    pr:  piatti.filter(p => p.tipo === 'pr').length,
    se:  piatti.filter(p => p.tipo === 'se').length,
    con: piatti.filter(p => p.tipo === 'con').length,
    des: piatti.filter(p => p.tipo === 'des').length,
  }), [piatti])

  const filteredPiatti = useMemo(() => piatti.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.tipo === activeCategory
    const matchesSearch = p.nome_it.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [piatti, activeCategory, search])

  // Virtualizzazione: in DOM solo le righe visibili (+ overscan), non tutte.
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredPiatti.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 113, // altezza media riga; corretta a runtime da measureElement
    overscan: 8,
    getItemKey: (index) => filteredPiatti[index].id,
  })

  const openEdit = useCallback((piatto: Piatto) => {
    setViewPiatto(null)
    setTimeout(() => setEditPiatto(piatto), 0)
  }, [])

  const openElimina = useCallback((id: number) => {
    setViewPiatto(null)
    setEditPiatto(null)
    setTimeout(() => setEliminaId(id), 0)
  }, [])

  const handleDelete = async () => {
    if (!eliminaId) return
    const ok = await deletePiatto(eliminaId)
    if (ok) setEliminaId(null)
  }

  return (
    <AppLayout sidebarExtra={<CategorieNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} counts={counts} />}>
      <div className="w-full pt-8 shrink-0">
        <div className="flex flex-col gap-4 px-8 pb-4 border-b border-gray-200">
          <div className="text-lg font-geist">{filteredPiatti.length} Piatti</div>
          <h1 className="text-6xl font-light font-fraunces">
            Elenco{' '}
            <span
              className="italic font-normal underline decoration-2 underline-offset-4"
              style={{ textDecorationColor: COLORS.accent }}
            >
              Piatti
            </span>
          </h1>
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: COLORS.text }} />
              <Input
                type="text"
                placeholder={`Cerca per nome o ID tra ${piatti.length.toLocaleString('it-IT')} piatti…`}
                className="pl-9 h-10 border-gray-300 rounded-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="h-10 px-4 py-2 rounded-lg flex items-center bg-black text-white text-base font-medium hover:bg-neutral-800 transition-colors"
              onClick={() => setNuovoOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo piatto
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[4px_1fr_320px_32px] gap-5 px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50 shrink-0">
        <span />
        <span>Piatto</span>
        <span>Allergeni · Caratteristiche</span>
        <span />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-base text-gray-400">Caricamento...</div>
        )}
        {!loading && error && (
          <div className="flex items-center justify-center h-32 text-base text-red-500">Errore: {error}</div>
        )}
        {!loading && !error && (
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const piatto = filteredPiatti[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <PiattoCard
                    piatto={piatto}
                    onOpenRicetta={setViewPiatto}
                    onOpenModifica={openEdit}
                    onOpenElimina={openElimina}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PiattoDrawerView
        piatto={viewPiatto}
        open={!!viewPiatto}
        onClose={() => setViewPiatto(null)}
        onEdit={openEdit}
        onDelete={openElimina}
      />

      <PiattoDrawerEdit
        piatto={editPiatto}
        open={!!editPiatto}
        onClose={() => setEditPiatto(null)}
        onSave={updatePiatto}
        onDelete={openElimina}
      />

      <PiattoDrawerNew
        open={nuovoOpen}
        onClose={() => setNuovoOpen(false)}
        onSave={createPiatto}
      />

      <ConfirmDeleteDialog
        open={!!eliminaId}
        onClose={() => setEliminaId(null)}
        onConfirm={handleDelete}
      />
    </AppLayout>
  )
}
