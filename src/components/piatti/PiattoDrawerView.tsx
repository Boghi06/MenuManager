import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { COLORS } from '@/constants'
import { TIPO_LABEL, CARATTERISTICHE, ALLERGENI, TRANSLATIONS } from '@/constants/piatti'
import type { Piatto } from '@/types/piatto'

interface PiattoDrawerViewProps {
  piatto: Piatto | null
  open: boolean
  onClose: () => void
  onEdit: (piatto: Piatto) => void
  onDelete: (id: number) => void
}

export function PiattoDrawerView({ piatto, open, onClose, onEdit, onDelete }: PiattoDrawerViewProps) {
  const attiveCaratteristiche = CARATTERISTICHE.filter(c => piatto?.[c.field as keyof Piatto])
  const attiveAllergeni = ALLERGENI.filter(a => piatto?.[a.field as keyof Piatto])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent className="overflow-hidden bg-white p-0 flex flex-col" style={{ width: '70vw', maxWidth: '70vw' }}>
        <div className="flex flex-col h-full pt-8">
          <div className="flex-1 overflow-y-auto pb-8">

            <div className="flex flex-col gap-1 pb-8 border-b border-gray-200 px-8">
              <div className="text-sm text-gray-500 font-geist">
                {piatto?.id} · {TIPO_LABEL[piatto?.tipo ?? ''] ?? '—'}
              </div>
              <h2 className="text-3xl font-light font-fraunces">{piatto?.nome_it}</h2>
            </div>

            <div className="flex flex-col gap-2 mt-8 pb-8 border-b border-gray-200 px-8">
              <div className="font-geist text-base">Nome piatto / Traduzioni</div>
              <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
                {TRANSLATIONS.map(({ lang, field }) => (
                  <div key={lang} className="flex items-center gap-4">
                    <span className="w-20 text-sm text-gray-500">{lang}</span>
                    <span className="flex-1 text-sm bg-white rounded-sm px-3 py-1.5 min-h-8">
                      {(piatto?.[field] as string | null) ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
              <div className="font-geist text-base">Tipologia</div>
              <div className="bg-gray-200 rounded-md h-10 flex items-center px-4 font-semibold text-sm">
                {TIPO_LABEL[piatto?.tipo ?? ''] ?? '—'}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
              <div className="font-geist text-base">Preparazione</div>
              <div className="w-full min-h-32 border border-gray-200 rounded-md p-3 text-sm">
                {piatto?.ricetta
                  ? <span>{piatto.ricetta}</span>
                  : <span className="text-gray-400 italic">Nessuna preparazione inserita.</span>
                }
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
              <div className="flex flex-col gap-4">
                <div className="font-geist text-base">Caratteristiche</div>
                <div className="flex flex-col gap-2 text-sm">
                  {attiveCaratteristiche.length > 0
                    ? attiveCaratteristiche.map(({ field, label, Icon }) => (
                        <div key={field} className="flex items-center gap-2">
                          <Icon className="w-4 h-4" /> {label}
                        </div>
                      ))
                    : <span className="text-gray-400 italic">Nessuna caratteristica selezionata.</span>
                  }
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="font-geist text-base">Allergeni</div>
                <div className="flex flex-col gap-2 text-sm">
                  {attiveAllergeni.length > 0
                    ? attiveAllergeni.map(({ field, label, Icon }) => (
                        <div key={field} className="flex items-center gap-2">
                          <Icon className="w-4 h-4" /> {label}
                        </div>
                      ))
                    : <span className="text-gray-400 italic">Nessun allergene selezionato.</span>
                  }
                </div>
              </div>
            </div>

          </div>

          <SheetFooter className="border-t border-gray-200 pt-6 flex flex-row justify-between w-full items-center px-8">
            <Button
              variant="outline"
              className="flex items-center h-10"
              style={{ borderColor: COLORS.accent, color: COLORS.accent }}
              onClick={() => piatto && onDelete(piatto.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Elimina
            </Button>
            <div className="flex gap-4">
              <button
                className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
                style={{ color: COLORS.text }}
                onClick={onClose}
              >
                Chiudi
              </button>
              <Button
                className="text-white h-10 hover:opacity-80"
                style={{ backgroundColor: COLORS.text }}
                onClick={() => piatto && onEdit(piatto)}
              >
                <Pencil className="w-4 h-4 mr-2" /> Modifica
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
