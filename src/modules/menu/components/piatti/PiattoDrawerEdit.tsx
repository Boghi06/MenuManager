import { useState, useCallback } from 'react'
import { SheetFooter } from '@/core/ui/sheet'
import { Button } from '@/core/ui/button'
import { Trash2 } from 'lucide-react'
import { TIPO_LABEL, EMPTY_FORM } from '@/modules/menu/constants/piatti'
import { PiattoFormFields } from './PiattoFormFields'
import type { Piatto, PiattoForm } from '@/modules/menu/types/piatto'

interface PiattoEditContentProps {
  piatto: Piatto | null
  onClose: () => void
  onSave: (id: number, form: PiattoForm) => Promise<boolean>
  onDelete: (id: number) => void
}

/**
 * Form di modifica del piatto. Non monta un Sheet proprio: vive dentro quello
 * condiviso di PiattoDrawer (vedi PiattoViewContent).
 */
export function PiattoEditContent({ piatto, onClose, onSave, onDelete }: PiattoEditContentProps) {
  // Inizializzato subito dal piatto, non da un effetto: arrivando dalla scheda
  // il form è già compilato al primo render, senza un frame di campi vuoti.
  // Il cambio di piatto lo gestisce la `key` in PiattoDrawer (rimonta il form):
  // risincronizzare a ogni nuova identità di `piatto` sovrascriverebbe le
  // modifiche in corso quando usePiatti rivalida in background.
  const [form, setForm] = useState<PiattoForm>(() => piatto ? { ...piatto } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const onChange = useCallback((patch: Partial<PiattoForm>) => setForm(prev => ({ ...prev, ...patch })), [])

  const handleSave = async () => {
    if (!piatto) return
    setSaving(true)
    const ok = await onSave(piatto.id, form)
    if (ok) onClose()
    setSaving(false)
  }

  return (
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
          style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
          onClick={() => piatto && onDelete(piatto.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Elimina
        </Button>
        <div className="flex gap-4">
          <button
            className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-base font-medium transition-colors"
            style={{ color: 'var(--brand-ink)' }}
            onClick={onClose}
          >
            Annulla
          </button>
          <Button
            className="text-white h-10 hover:opacity-80"
            style={{ backgroundColor: 'var(--brand-ink)' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvataggio…' : 'Salva modifiche'}
          </Button>
        </div>
      </SheetFooter>
    </div>
  )
}
