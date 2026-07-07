import { useState, useCallback } from 'react'
import { Sheet, SheetContent, SheetFooter } from '@/core/ui/sheet'
import { Button } from '@/core/ui/button'
import { COLORS } from '@/constants'
import { EMPTY_FORM } from '@/modules/menu/constants/piatti'
import { PiattoFormFields } from './PiattoFormFields'
import type { PiattoForm } from '@/modules/menu/types/piatto'

interface PiattoDrawerNewProps {
  open: boolean
  onClose: () => void
  onSave: (form: PiattoForm) => Promise<string | null>
}

export function PiattoDrawerNew({ open, onClose, onSave }: PiattoDrawerNewProps) {
  const [form, setForm] = useState<PiattoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = useCallback((patch: Partial<PiattoForm>) => setForm(prev => ({ ...prev, ...patch })), [])

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!form.nome_it.trim()) return
    setSaving(true)
    setError(null)
    const err = await onSave(form)
    if (err) {
      setError(err)
    } else {
      setForm(EMPTY_FORM)
      onClose()
    }
    setSaving(false)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <SheetContent className="overflow-hidden bg-white p-0 flex flex-col" style={{ width: '70vw', maxWidth: '70vw' }}>
        <div className="flex flex-col h-full pt-8">
          <div className="flex-1 overflow-y-auto pb-8">
            <div className="flex flex-col gap-1 pb-8 border-b border-gray-200 px-8">
              <div className="text-base text-gray-500 font-geist">Nuovo piatto</div>
              <h2 className="text-4xl font-light font-fraunces">Aggiungi piatto</h2>
            </div>
            <div className="mt-8">
              <PiattoFormFields form={form} onChange={onChange} />
            </div>
          </div>

          <SheetFooter className="border-t border-gray-200 pt-6 flex flex-col w-full px-8 gap-3">
            {error && <p className="text-base text-red-500 text-right">{error}</p>}
            <div className="flex flex-row justify-end items-center gap-4">
              <button
                className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-base font-medium transition-colors"
                style={{ color: COLORS.text }}
                onClick={handleClose}
              >
                Annulla
              </button>
              <Button
                className="text-white h-10 hover:opacity-80"
                style={{ backgroundColor: COLORS.text }}
                onClick={handleSave}
                disabled={saving || !form.nome_it.trim()}
              >
                {saving ? 'Salvataggio…' : 'Aggiungi piatto'}
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
