import { useState, useMemo, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { COLORS } from '@/constants'
import { usePiatti } from '@/hooks/usePiatti'
import { AppLayout } from '@/components/layout/AppLayout'
import { PiattoCard } from '@/components/piatti/PiattoCard'
import { PiattoDrawerView } from '@/components/piatti/PiattoDrawerView'
import { PiattoDrawerEdit } from '@/components/piatti/PiattoDrawerEdit'
import { PiattoDrawerNew } from '@/components/piatti/PiattoDrawerNew'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import type { Piatto } from '@/types/piatto'

export default function Dashboard() {
  const { piatti, loading, error, createPiatto, updatePiatto, deletePiatto } = usePiatti()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const [viewPiatto, setViewPiatto] = useState<Piatto | null>(null)
  const [editPiatto, setEditPiatto] = useState<Piatto | null>(null)
  const [nuovoOpen, setNuovoOpen] = useState(false)
  const [eliminaId, setEliminaId] = useState<number | null>(null)

  const filteredPiatti = useMemo(() => piatti.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.tipo === activeCategory
    const matchesSearch = p.nome_it.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }), [piatti, activeCategory, search])

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
    <AppLayout activeCategory={activeCategory} onCategoryChange={setActiveCategory}>
      <div className="w-full pt-8 shrink-0">
        <div className="flex flex-col gap-4 px-8 pb-4 border-b border-gray-200">
          <div className="text-base font-geist">{filteredPiatti.length} Piatti</div>
          <h1 className="text-5xl font-light font-fraunces">
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
                placeholder="Cerca"
                className="pl-9 h-10 border-gray-300 rounded-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className="h-10 border border-gray-300 px-4 py-2 rounded-lg flex items-center bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
              style={{ color: COLORS.text }}
              onClick={() => setNuovoOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo piatto
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Caricamento...</div>
        )}
        {!loading && error && (
          <div className="flex items-center justify-center h-32 text-sm text-red-500">Errore: {error}</div>
        )}
        {!loading && !error && filteredPiatti.map(piatto => (
          <PiattoCard
            key={piatto.id}
            piatto={piatto}
            onOpenRicetta={setViewPiatto}
            onOpenModifica={openEdit}
            onOpenElimina={openElimina}
          />
        ))}
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
