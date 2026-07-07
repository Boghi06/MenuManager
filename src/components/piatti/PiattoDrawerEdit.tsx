import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetFooter } from '@/core/ui/sheet'
import { Button } from '@/core/ui/button'
import { Trash2 } from 'lucide-react'
import { COLORS } from '@/constants'
import { TIPO_LABEL, CODE_TO_TIPO, EMPTY_FORM } from '@/constants/piatti'
import { PiattoFormFields } from './PiattoFormFields'
import type { Piatto, PiattoForm } from '@/types/piatto'

interface PiattoDrawerEditProps {
  piatto: Piatto | null
  open: boolean
  onClose: () => void
  onSave: (id: number, form: PiattoForm) => Promise<boolean>
  onDelete: (id: number) => void
}

export function PiattoDrawerEdit({ piatto, open, onClose, onSave, onDelete }: PiattoDrawerEditProps) {
  const [form, setForm] = useState<PiattoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (piatto) setForm({ ...piatto, tipo: CODE_TO_TIPO[piatto.tipo ?? ''] ?? piatto.tipo })
  }, [piatto])

  const onChange = useCallback((patch: Partial<PiattoForm>) => setForm(prev => ({ ...prev, ...patch })), [])

  const handleSave = async () => {
    if (!piatto) return
    setSaving(true)
    const ok = await onSave(piatto.id, form)
    if (ok) onClose()
    setSaving(false)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent className="overflow-hidden bg-white p-0 flex flex-col" style={{ width: '70vw', maxWidth: '70vw' }}>
        <div className="flex flex-col h-full pt-8">
          <div className="flex-1 overflow-y-auto pb-8">
            <div className="flex flex-col gap-1 pb-8 border-b border-gray-200 px-8">
              <div className="text-base text-gray-500 font-geist">Modifica piatto</div>
              <h2 className="text-4xl font-light font-fraunces">{piatto?.nome_it}</h2>
              <div className="text-base text-gray-500">
                {piatto?.id} - {TIPO_LABEL[piatto?.tipo ?? ''] ?? '—'}
              </div>
            </div>
            <div className="mt-8">
              <PiattoFormFields form={form} onChange={onChange} />
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
                className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-base font-medium transition-colors"
                style={{ color: COLORS.text }}
                onClick={onClose}
              >
                Annulla
              </button>
              <Button
                className="text-white h-10 hover:opacity-80"
                style={{ backgroundColor: COLORS.text }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvataggio…' : 'Salva modifiche'}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
