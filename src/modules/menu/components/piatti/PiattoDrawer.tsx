import { Sheet, SheetContent } from '@/core/ui/sheet'
import { PiattoViewContent } from './PiattoDrawerView'
import { PiattoEditContent } from './PiattoDrawerEdit'
import type { Piatto, PiattoForm } from '@/modules/menu/types/piatto'

/** Cosa mostra il drawer: la scheda in lettura o il form di modifica. */
export type PiattoDrawerModo = 'view' | 'edit'

interface PiattoDrawerProps {
  piatto: Piatto | null
  modo: PiattoDrawerModo
  open: boolean
  onClose: () => void
  /** Passa dalla scheda al form restando aperti. */
  onModifica: () => void
  onSave: (id: number, form: PiattoForm) => Promise<boolean>
  onDelete: (id: number) => void
  /** Sola consultazione (ruolo receptionist): niente modifica né eliminazione. */
  readOnly?: boolean
}

/**
 * Un solo Sheet per scheda e modifica del piatto: premendo "Modifica" cambia
 * il contenuto e basta. Con due Sheet separati il pannello si chiudeva e
 * riapriva, con l'animazione di slide a ogni passaggio.
 */
export function PiattoDrawer({ piatto, modo, open, onClose, onModifica, onSave, onDelete, readOnly = false }: PiattoDrawerProps) {
  // In sola lettura il form di modifica non si monta nemmeno: `modo` potrebbe
  // arrivare a 'edit' da uno stato rimasto in pagina.
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent className="overflow-hidden bg-white p-0 flex flex-col" style={{ width: '70vw', maxWidth: '70vw' }}>
        {readOnly || modo === 'view' ? (
          <PiattoViewContent
            piatto={piatto}
            onClose={onClose}
            onEdit={onModifica}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ) : (
          // key sull'id: cambiando piatto il form riparte pulito invece di
          // conservare i valori di quello precedente.
          <PiattoEditContent
            key={piatto?.id}
            piatto={piatto}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
