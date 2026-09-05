import { useState, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/core/ui/input'
import { portateDi } from '@/modules/menu/constants/piatti'
import { usePiatti } from '@/modules/menu/hooks/usePiatti'
import { AppLayout } from '@/core/layout/AppLayout'
import { useRole } from '@/core/auth/roles'
import { PageHeader } from '@/core/layout/PageHeader'
import { PiattoCard } from '@/modules/menu/components/piatti/PiattoCard'
import { CategorieNav } from '@/modules/menu/components/piatti/CategorieNav'
import { LegendaCategorie } from '@/modules/menu/components/piatti/LegendaCategorie'
import { PiattoDrawer, type PiattoDrawerModo } from '@/modules/menu/components/piatti/PiattoDrawer'
import { PiattoDrawerNew } from '@/modules/menu/components/piatti/PiattoDrawerNew'
import { ConfirmDeleteDialog } from '@/core/components/ConfirmDeleteDialog'
import type { Piatto } from '@/modules/menu/types/piatto'

export default function Dashboard() {
  const { piatti, loading, error, createPiatto, updatePiatto, deletePiatto } = usePiatti()

  // Il receptionist consulta la libreria e la stampa, non la modifica:
  // la scrittura è di cucina e admin (e la RLS la impone comunque).
  const readOnly = useRole() === 'receptionist'

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Un solo drawer per scheda e modifica: il passaggio fra i due è un cambio
  // di `drawerModo`, così il pannello non si chiude e riapre.
  // `drawerPiatto` non viene azzerato alla chiusura: resta finché non si apre
  // un altro piatto, così il contenuto non si svuota durante l'animazione di
  // uscita del pannello.
  const [drawerPiatto, setDrawerPiatto] = useState<Piatto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerModo, setDrawerModo] = useState<PiattoDrawerModo>('view')
  const [nuovoOpen, setNuovoOpen] = useState(false)
  const [eliminaId, setEliminaId] = useState<number | null>(null)

  // Arrivo da un link esterno (click su un piatto nella composizione menù):
  // `?piatto=<id>` apre la sua scheda in sola lettura.
  //
  // Lo stato si aggiusta durante il render e non dentro un useEffect: l'elenco
  // piatti arriva in modo asincrono, così la scheda si apre nel primo render in
  // cui il piatto esiste davvero, senza un frame di drawer vuoto. `paramAperto`
  // ricorda quale id è già stato consumato, altrimenti chiudendo il drawer si
  // riaprirebbe da solo al render successivo.
  const [searchParams, setSearchParams] = useSearchParams()
  const piattoParam = searchParams.get('piatto')
  const [paramAperto, setParamAperto] = useState<string | null>(null)

  if (piattoParam !== null && piattoParam !== paramAperto) {
    const daAprire = piatti.find(p => p.id === Number(piattoParam))
    if (daAprire) {
      setParamAperto(piattoParam)
      setDrawerModo('view')
      setDrawerPiatto(daAprire)
      setDrawerOpen(true)
    }
  }

  // `?piatto` va tolto appena il drawer smette di mostrare quel piatto: senza,
  // un refresh riaprirebbe una scheda chiusa, o ne aprirebbe una diversa da
  // quella a schermo se nel frattempo se n'è aperta un'altra dalla lista.
  const pulisciParamPiatto = useCallback(() => {
    if (piattoParam === null) return
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('piatto')
      return next
    }, { replace: true })
  }, [piattoParam, setSearchParams])

  const chiudiDrawer = useCallback(() => {
    setDrawerOpen(false)
    pulisciParamPiatto()
  }, [pulisciParamPiatto])

  // Un piatto con più portate viene contato in ognuna: la somma delle voci
  // può superare il totale, ed è giusto — sono i piatti selezionabili in quella
  // sezione, non una ripartizione.
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: piatti.length, antipasti: 0, primi: 0, secondi: 0, contorni: 0 }
    for (const p of piatti) for (const t of portateDi(p)) c[t] = (c[t] ?? 0) + 1
    return c
  }, [piatti])

  const filteredPiatti = useMemo(() => {
    // Stessa ricerca del selettore piatto: nome italiano oppure id (il codice
    // stampato sulle ricette, con cui la cucina cerca i piatti).
    const q = search.trim().toLowerCase()
    return piatti.filter(p => {
      const matchesCategory = activeCategory === 'all' || portateDi(p).includes(activeCategory)
      const matchesSearch = !q || p.nome_it.toLowerCase().includes(q) || String(p.id).includes(q)
      return matchesCategory && matchesSearch
    })
  }, [piatti, activeCategory, search])

  // Virtualizzazione: in DOM solo le righe visibili (+ overscan), non tutte.
  const scrollRef = useRef<HTMLDivElement>(null)
  // useVirtualizer restituisce funzioni non memoizzabili: il React Compiler
  // salta la memoizzazione di questa pagina. È un limite di TanStack Virtual,
  // non un difetto qui — la pagina non passa i suoi valori a componenti memo.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: filteredPiatti.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 113, // altezza media riga; corretta a runtime da measureElement
    overscan: 8,
    getItemKey: (index) => filteredPiatti[index].id,
  })

  const openScheda = useCallback((piatto: Piatto) => {
    pulisciParamPiatto()
    setDrawerModo('view')
    setDrawerPiatto(piatto)
    setDrawerOpen(true)
  }, [pulisciParamPiatto])

  const openEdit = useCallback((piatto: Piatto) => {
    pulisciParamPiatto()
    setDrawerModo('edit')
    setDrawerPiatto(piatto)
    setDrawerOpen(true)
  }, [pulisciParamPiatto])

  const openElimina = useCallback((id: number) => {
    chiudiDrawer()
    setTimeout(() => setEliminaId(id), 0)
  }, [chiudiDrawer])

  const handleDelete = async () => {
    if (!eliminaId) return
    const ok = await deletePiatto(eliminaId)
    if (ok) setEliminaId(null)
  }

  return (
    <AppLayout sidebarExtra={<CategorieNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} counts={counts} />}>
      <PageHeader
        eyebrow={`${filteredPiatti.length.toLocaleString('it-IT')} piatti`}
        title="Elenco piatti"
      >
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-brand-ink" />
            <Input
              type="text"
              placeholder={`Cerca per nome o ID tra ${piatti.length.toLocaleString('it-IT')} piatti…`}
              className="pl-9 h-10 border-gray-300 rounded-lg"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* leggenda del colore della barra a sinistra di ogni piatto */}
          <LegendaCategorie />
          </div>
          {!readOnly && (
            <button
              className="h-10 px-4 py-2 rounded-lg flex items-center bg-black text-white text-base font-medium hover:bg-neutral-800 transition-colors"
              onClick={() => setNuovoOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo piatto
            </button>
          )}
        </div>
      </PageHeader>

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
                    onOpenRicetta={openScheda}
                    onOpenModifica={openEdit}
                    onOpenElimina={openElimina}
                    readOnly={readOnly}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PiattoDrawer
        piatto={drawerPiatto}
        modo={drawerModo}
        open={drawerOpen}
        onClose={chiudiDrawer}
        onModifica={() => setDrawerModo('edit')}
        onSave={updatePiatto}
        onDelete={openElimina}
        readOnly={readOnly}
      />

      {!readOnly && (
        <PiattoDrawerNew
          open={nuovoOpen}
          onClose={() => setNuovoOpen(false)}
          onSave={createPiatto}
        />
      )}

      <ConfirmDeleteDialog
        open={!!eliminaId}
        onClose={() => setEliminaId(null)}
        onConfirm={handleDelete}
      />
    </AppLayout>
  )
}
