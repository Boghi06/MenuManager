import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CARATTERISTICHE, ALLERGENI, TRANSLATIONS } from '@/constants/piatti'
import type { PiattoForm } from '@/types/piatto'

interface PiattoFormFieldsProps {
  form: PiattoForm
  onChange: (patch: Partial<PiattoForm>) => void
}

export const PiattoFormFields = memo(function PiattoFormFields({ form, onChange }: PiattoFormFieldsProps) {
  const cb = (field: keyof PiattoForm) => (v: boolean) => onChange({ [field]: v })

  return (
    <>
      <div className="flex flex-col gap-2 pb-8 border-b border-gray-200 px-8">
        <div className="font-geist text-base">Nome piatto / Traduzioni</div>
        <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
          {TRANSLATIONS.map(({ lang, field, maxLength }) => {
            const val = (form[field] as string) ?? ''
            const atLimit = maxLength !== undefined && val.length >= maxLength
            return (
              <div key={lang} className="flex items-center gap-4">
                <label className="w-20 text-sm">{lang}</label>
                <div className="flex-1 relative">
                  <Input
                    value={val}
                    onChange={e => onChange({ [field]: e.target.value })}
                    maxLength={maxLength}
                    className="w-full bg-white border-none rounded-sm h-8"
                  />
                  {maxLength !== undefined && (
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs tabular-nums pointer-events-none ${atLimit ? 'text-red-500' : 'text-gray-400'}`}>
                      {val.length}/{maxLength}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
        <div className="font-geist text-base">Tipologia</div>
        <Select value={form.tipo ?? 'primo'} onValueChange={v => onChange({ tipo: v })}>
          <SelectTrigger className="w-full bg-gray-200 border-none rounded-md h-10 shadow-none ring-0 focus:ring-0 font-semibold px-4">
            <SelectValue placeholder="Seleziona tipologia" />
          </SelectTrigger>
          <SelectContent className="bg-gray-200 border-none shadow-none ring-0 rounded-md font-sans">
            <SelectItem value="primo"    className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Primo</SelectItem>
            <SelectItem value="secondo"  className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Secondo</SelectItem>
            <SelectItem value="contorno" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Contorno</SelectItem>
            <SelectItem value="dessert"  className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Dessert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
        <div className="font-geist text-base">Preparazione</div>
        <Textarea
          value={form.ricetta ?? ''}
          onChange={e => onChange({ ricetta: e.target.value })}
          className="w-full min-h-32 border-gray-300 resize-none rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
        <div className="flex flex-col gap-4">
          <div className="font-geist text-base">Caratteristiche</div>
          <div className="flex flex-col gap-3">
            {CARATTERISTICHE.map(({ field, label, Icon }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox id={`form-${field}`} className="rounded-full" checked={!!form[field]} onCheckedChange={cb(field)} />
                <label htmlFor={`form-${field}`} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4" /> {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="font-geist text-base">Allergeni</div>
          <div className="grid grid-cols-2 gap-4">
            {ALLERGENI.map(({ field, label, Icon }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox id={`form-${field}`} className="rounded-full" checked={!!form[field]} onCheckedChange={cb(field)} />
                <label htmlFor={`form-${field}`} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4" /> {label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
})
