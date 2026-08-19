import { Fragment, memo } from 'react'
import { Input } from '@/core/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/core/ui/select'
import { Textarea } from '@/core/ui/textarea'
import { Checkbox } from '@/core/ui/checkbox'
import {
  CARATTERISTICHE, ALLERGENI, TRANSLATIONS, TIPI_PIATTO, TIPO_LABEL,
  CATEGORIE_PIATTO, CATEGORIA_BAR, CATEGORIA_LABEL,
} from '@/modules/menu/constants/piatti'
import type { CategoriaPiatto, PiattoForm } from '@/modules/menu/types/piatto'

interface PiattoFormFieldsProps {
  form: PiattoForm
  onChange: (patch: Partial<PiattoForm>) => void
}

export const PiattoFormFields = memo(function PiattoFormFields({ form, onChange }: PiattoFormFieldsProps) {
  const cb = (field: keyof PiattoForm) => (v: boolean) => onChange({ [field]: v })

  // La tipologia attuale del piatto va in cima alla tendina, le altre sotto:
  // si legge subito com'è classificato senza cercarlo nell'elenco.
  const tipoCorrente = form.tipo ?? 'primi'
  const opzioniTipo = [tipoCorrente, ...TIPI_PIATTO.filter(t => t !== tipoCorrente)]

  return (
    <>
      <div className="flex flex-col gap-2 pb-8 border-b border-gray-200 px-8">
        <div className="font-geist text-lg">Nome piatto / Traduzioni</div>
        <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
          {TRANSLATIONS.map(({ lang, field, maxLength }) => {
            const val = (form[field] as string) ?? ''
            const atLimit = maxLength !== undefined && val.length >= maxLength
            return (
              <div key={lang} className="flex items-center gap-4">
                <label className="w-20 text-base">{lang}</label>
                <div className="flex-1 relative">
                  <Input
                    value={val}
                    onChange={e => onChange({ [field]: e.target.value })}
                    maxLength={maxLength}
                    className="w-full bg-white border-none rounded-sm h-8"
                  />
                  {maxLength !== undefined && (
                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm tabular-nums pointer-events-none ${atLimit ? 'text-red-500' : 'text-gray-400'}`}>
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
        <div className="font-geist text-lg">Tipologia</div>
        {/* items: mappa valore→etichetta. Senza, il trigger mostra il valore
            grezzo salvato in DB ("antipasti") finché la tendina non viene
            aperta almeno una volta, invece dell'etichetta ("Antipasto").
            alignItemWithTrigger={false}: la tendina si apre SOTTO il campo
            invece di sovrapporsi ai campi già compilati. */}
        <Select items={TIPO_LABEL} value={tipoCorrente} onValueChange={v => onChange({ tipo: v })}>
          <SelectTrigger className="w-full bg-gray-200 border-none rounded-md h-10 shadow-none ring-0 focus:ring-0 font-semibold px-4">
            <SelectValue placeholder="Seleziona tipologia" />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="bg-white border border-gray-200 shadow-lg ring-0 rounded-md font-sans p-1"
          >
            {opzioniTipo.map((tipo, i) => (
              <Fragment key={tipo}>
                {/* separatore fra la voce attuale e le alternative */}
                {i === 1 && <SelectSeparator className="my-1 bg-gray-200" />}
                <SelectItem
                  value={tipo}
                  className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer px-3 py-2 rounded"
                >
                  {TIPO_LABEL[tipo] ?? tipo}
                  {i === 0 && <span className="text-xs text-gray-400 font-normal">attuale</span>}
                </SelectItem>
              </Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categoria: decide il colore della barra del piatto nell'elenco e nella
          composizione menù. Bottoni invece di una tendina perché il colore va
          visto mentre si sceglie; "Non specificata" resta possibile per i
          piatti storici, che mantengono la barra grigia. */}
      <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
        <div className="font-geist text-lg">Categoria</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIE_PIATTO.map(cat => {
            const attiva = form.categoria === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange({ categoria: attiva ? null : (cat as CategoriaPiatto) })}
                className={`flex items-center gap-2 h-10 px-4 rounded-md border text-base transition-colors
                            ${attiva ? 'bg-white font-semibold' : 'bg-gray-200 border-transparent hover:bg-gray-300'}`}
                style={attiva ? { borderColor: CATEGORIA_BAR[cat], color: CATEGORIA_BAR[cat] } : undefined}
              >
                <span className="rounded-sm shrink-0" style={{ width: 4, height: 18, background: CATEGORIA_BAR[cat] }} />
                {CATEGORIA_LABEL[cat]}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => onChange({ categoria: null })}
            className={`h-10 px-4 rounded-md border text-base transition-colors
                        ${form.categoria === null
                          ? 'bg-white border-gray-400 font-semibold text-gray-600'
                          : 'bg-gray-200 border-transparent text-gray-500 hover:bg-gray-300'}`}
          >
            Non specificata
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
        <div className="font-geist text-lg">Preparazione</div>
        <Textarea
          value={form.ricetta ?? ''}
          onChange={e => onChange({ ricetta: e.target.value })}
          className="w-full min-h-32 border-gray-300 resize-none rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
        <div className="flex flex-col gap-4">
          <div className="font-geist text-lg">Caratteristiche</div>
          <div className="flex flex-col gap-3">
            {CARATTERISTICHE.map(({ field, label, Icon }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox id={`form-${field}`} className="rounded-full" checked={!!form[field]} onCheckedChange={cb(field)} />
                <label htmlFor={`form-${field}`} className="flex items-center gap-2 text-base">
                  <Icon className="w-4 h-4" /> {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="font-geist text-lg">Allergeni</div>
          <div className="grid grid-cols-2 gap-4">
            {ALLERGENI.map(({ field, label, Icon, number }) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox id={`form-${field}`} className="rounded-full" checked={!!form[field]} onCheckedChange={cb(field)} />
                <label htmlFor={`form-${field}`} className="flex items-center gap-2 text-lg">
                  <Icon className="w-5 h-5" /> {number}. {label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
})
