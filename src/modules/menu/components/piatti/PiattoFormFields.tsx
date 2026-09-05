import { memo } from 'react'
import { Input } from '@/core/ui/input'
import { Textarea } from '@/core/ui/textarea'
import { Checkbox } from '@/core/ui/checkbox'
import {
  CARATTERISTICHE, ALLERGENI, TRANSLATIONS, TIPI_PIATTO, TIPO_LABEL,
  CATEGORIE_PIATTO, CATEGORIA_BAR, CATEGORIA_LABEL, portateDi,
} from '@/modules/menu/constants/piatti'
import type { CategoriaPiatto, PiattoForm } from '@/modules/menu/types/piatto'

interface PiattoFormFieldsProps {
  form: PiattoForm
  onChange: (patch: Partial<PiattoForm>) => void
}

export const PiattoFormFields = memo(function PiattoFormFields({ form, onChange }: PiattoFormFieldsProps) {
  const cb = (field: keyof PiattoForm) => (v: boolean) => onChange({ [field]: v })

  const portate = portateDi(form)

  // Le portate restano nell'ordine delle portate, non in quello dei click: la
  // prima è la principale (`tipo`), e con un ordine fisso resta prevedibile
  // senza dover offrire un riordino a mano. Almeno una va sempre selezionata.
  const cambiaPortata = (tipo: string) => {
    const scelte = portate.includes(tipo) ? portate.filter(t => t !== tipo) : [...portate, tipo]
    if (scelte.length === 0) return
    const tipi = TIPI_PIATTO.filter(t => scelte.includes(t)) as string[]
    onChange({ tipi, tipo: tipi[0] })
  }

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

      {/* Tipologia: più di una è ammessa (migrazione 026). Bottoni e non una
          tendina, come per la categoria: la selezione multipla si legge tutta
          in una volta, mentre una tendina nasconderebbe le voci scelte. */}
      <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
        <div className="font-geist text-lg">Tipologia</div>
        <div className="flex flex-wrap gap-2">
          {TIPI_PIATTO.map(tipo => {
            const attiva = portate.includes(tipo)
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => cambiaPortata(tipo)}
                aria-pressed={attiva}
                className={`h-10 px-4 rounded-md border text-base transition-colors
                            ${attiva
                              ? 'bg-white border-gray-900 font-semibold'
                              : 'bg-gray-200 border-transparent hover:bg-gray-300'}`}
              >
                {TIPO_LABEL[tipo] ?? tipo}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-gray-500">
          {portate.length > 1
            ? `Il piatto comparirà in tutte e ${portate.length} le sezioni. Principale: ${TIPO_LABEL[portate[0]] ?? portate[0]}.`
            : 'Un piatto può stare in più portate: comparirà nel selettore di ogni sezione scelta.'}
        </p>
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
