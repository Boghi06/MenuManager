import { useState, useRef, useMemo, useEffect } from 'react'
import { Plus, Pencil, Trash2, Copy, Calendar, Image as ImageIcon, ChevronDown, Upload } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useEventi } from '@/hooks/useEventi'
import type { Evento } from '@/types/evento'

// ─── Ordinamento ──────────────────────────────────────────────────────────────

type SortKey = 'recent' | 'nome' | 'created'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Utilizzo recente',
  nome: 'Nome A→Z',
  created: 'Più recenti',
}

function sortEventi(eventi: Evento[], key: SortKey): Evento[] {
  const arr = [...eventi]
  switch (key) {
    case 'nome':
      return arr.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
    case 'created':
      return arr.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    case 'recent':
    default:
      return arr.sort((a, b) => {
        // ultimo_uso desc nulls last
        if (a.ultimo_uso && b.ultimo_uso) return b.ultimo_uso.localeCompare(a.ultimo_uso)
        if (a.ultimo_uso) return -1
        if (b.ultimo_uso) return 1
        return a.nome.localeCompare(b.nome, 'it')
      })
  }
}

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-800 transition-colors"
      >
        Ordina: {SORT_LABELS[value].toLowerCase()}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-10 w-48 rounded-[10px] border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-1">
          {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors hover:bg-gray-50 ${k === value ? 'text-black font-medium' : 'text-gray-600'}`}
            >
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form crea / modifica / duplica ───────────────────────────────────────────

interface EventoFormProps {
  initial?: Partial<Evento> | null
  isEdit: boolean
  onSave: (nome: string, sottotitolo: string | null, immagine_url: string | null) => Promise<void>
  onCancel: () => void
  uploadImage: (file: File) => Promise<string | null>
}

function EventoForm({ initial, isEdit, onSave, onCancel, uploadImage }: EventoFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [sottotitolo, setSottotitolo] = useState(initial?.sottotitolo ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.immagine_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initial?.immagine_url ?? null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // upload differito: il file viene caricato solo al salvataggio (no orfani su annulla)
  const handleFile = (file: File) => {
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => { setImageFile(null); setImageUrl(null); setPreview(null) }

  const handleSave = async () => {
    if (!nome.trim()) return
    setSaving(true)
    let url = imageUrl
    if (imageFile) url = await uploadImage(imageFile)
    await onSave(nome.trim(), sottotitolo.trim() || null, url)
    setSaving(false)
  }

  const inp = 'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors'
  const lbl = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1'

  return (
    <div className="border border-gray-200 rounded-[14px] bg-white p-5 flex flex-col gap-4">
      <div className="flex gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <Upload className="w-6 h-6 text-gray-300" />}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="text-xs text-gray-500 hover:text-black transition-colors">
            {preview ? 'Cambia immagine' : 'Carica immagine'}
          </button>
          {preview && (
            <button type="button" onClick={removeImage}
              className="text-xs text-red-400 hover:text-red-600 transition-colors">
              Rimuovi
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div>
            <label className={lbl}>Nome evento *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} autoFocus
              placeholder="es. Solstizio d'estate" className={inp} />
          </div>
          <div>
            <label className={lbl}>Testo sotto (opzionale)</label>
            <input type="text" value={sottotitolo ?? ''} onChange={e => setSottotitolo(e.target.value)}
              placeholder="es. Gran buffet" className={inp} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={handleSave} disabled={saving || !nome.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea evento'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
          Annulla
        </button>
      </div>
    </div>
  )
}

// ─── Riga evento (card) ───────────────────────────────────────────────────────

function RigaEvento({ evento, onEdit, onDuplicate, onDelete }: {
  evento: Evento
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)

  const azione = 'w-9 h-9 rounded-[9px] border border-[#E8E8E8] bg-gray-50 flex items-center justify-center transition-colors'

  return (
    <div className="flex items-center gap-[18px] p-4 bg-white rounded-[14px] border border-[#DEDEDE] hover:border-[#A3A3A3] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all">
      {/* Thumbnail */}
      <div className="w-[88px] h-[88px] rounded-[10px] overflow-hidden border border-[#E8E8E8] shrink-0 flex items-center justify-center" style={{ background: '#ECECEC' }}>
        {evento.immagine_url
          ? <img src={evento.immagine_url} alt={evento.nome} className="w-full h-full object-cover" />
          : <ImageIcon className="w-7 h-7" style={{ color: '#737373' }} />}
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0">
        <div className="font-fraunces text-[22px] leading-[1.1] text-black truncate">{evento.nome}</div>
        {evento.sottotitolo && (
          <div className="font-fraunces italic text-[15px] text-gray-500 mt-[3px] truncate">{evento.sottotitolo}</div>
        )}
        <div className="mt-2.5">
          {evento.usi > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" />
              Assegnato a <span className="font-semibold text-gray-700">{evento.usi}</span> menù
            </span>
          ) : (
            <span className="text-[12.5px] text-gray-400">Non ancora assegnato</span>
          )}
        </div>
      </div>

      {/* Azioni */}
      {confirm ? (
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-[12px] text-gray-600 text-right max-w-[220px] leading-snug">
            {evento.usi > 0
              ? <>Questo evento è assegnato a <b>{evento.usi}</b> menù. Eliminandolo verrà rimosso da quei menù.</>
              : <>Eliminare questo evento?</>}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onDelete()}
              className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Elimina
            </button>
            <button onClick={() => setConfirm(false)}
              className="px-2.5 py-1 text-xs text-gray-500 rounded-md hover:bg-gray-100 transition-colors">
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onDuplicate} title="Duplica"
            className={`${azione} text-[#737373] hover:text-black hover:bg-gray-100`}>
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onEdit} title="Modifica"
            className={`${azione} text-[#737373] hover:text-black hover:bg-gray-100`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setConfirm(true)} title="Elimina"
            className={`${azione} text-[#8A8A8A] hover:text-red-500 hover:bg-red-50`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

type FormState =
  | { mode: 'none' }
  | { mode: 'new' }
  | { mode: 'edit'; evento: Evento }
  | { mode: 'duplicate'; initial: Partial<Evento> }

export default function GestioneEventi() {
  const { eventi, loading, uploadImage, createEvento, updateEvento, deleteEvento } = useEventi()
  const [form, setForm] = useState<FormState>({ mode: 'none' })
  const [sort, setSort] = useState<SortKey>('recent')

  const sorted = useMemo(() => sortEventi(eventi, sort), [eventi, sort])
  const editingId = form.mode === 'edit' ? form.evento.id : null
  const visibili = sorted.filter(e => e.id !== editingId)

  const closeForm = () => setForm({ mode: 'none' })

  return (
    <AppLayout showCategorie={false}>
      <div className="px-10 pt-[34px] pb-[26px] border-b border-gray-200">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
          Configurazione
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-fraunces font-light text-[44px] leading-none">Gestione eventi</h1>
            <p className="text-sm text-gray-500 mt-3">Libreria di eventi riutilizzabili nei menù stampati</p>
          </div>
          {form.mode === 'none' && (
            <button
              onClick={() => setForm({ mode: 'new' })}
              className="inline-flex items-center gap-2 h-[42px] px-[18px] rounded-[10px] bg-gray-900 text-white text-[14.5px] font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-[18px] h-[18px]" />
              Nuovo evento
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-10 bg-gray-50">
        <div className="flex flex-col gap-[14px]">

          {form.mode === 'new' && (
            <EventoForm
              isEdit={false}
              uploadImage={uploadImage}
              onSave={async (nome, sottotitolo, immagine_url) => {
                await createEvento(nome, sottotitolo, immagine_url)
                closeForm()
              }}
              onCancel={closeForm}
            />
          )}

          {form.mode === 'duplicate' && (
            <EventoForm
              isEdit={false}
              initial={form.initial}
              uploadImage={uploadImage}
              onSave={async (nome, sottotitolo, immagine_url) => {
                await createEvento(nome, sottotitolo, immagine_url)
                closeForm()
              }}
              onCancel={closeForm}
            />
          )}

          {form.mode === 'edit' && (
            <EventoForm
              isEdit
              initial={form.evento}
              uploadImage={uploadImage}
              onSave={async (nome, sottotitolo, immagine_url) => {
                await updateEvento(form.evento.id, nome, sottotitolo, immagine_url)
                closeForm()
              }}
              onCancel={closeForm}
            />
          )}

          {loading ? (
            <div className="text-sm text-gray-400">Caricamento…</div>
          ) : eventi.length === 0 && form.mode === 'none' ? (
            <div className="border border-dashed border-gray-200 rounded-[14px] py-12 text-center bg-white">
              <p className="text-gray-400 text-sm">Nessun evento creato.</p>
              <button onClick={() => setForm({ mode: 'new' })}
                className="mt-3 text-sm text-gray-600 hover:text-black underline underline-offset-2 transition-colors">
                Crea il primo evento
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[12.5px] text-gray-500 px-1 pb-0.5">
                <span className="font-semibold uppercase tracking-[0.5px]">
                  {eventi.length} {eventi.length === 1 ? 'evento' : 'eventi'}
                </span>
                <SortDropdown value={sort} onChange={setSort} />
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                {visibili.map(ev => (
                  <RigaEvento
                    key={ev.id}
                    evento={ev}
                    onEdit={() => setForm({ mode: 'edit', evento: ev })}
                    onDuplicate={() => setForm({
                      mode: 'duplicate',
                      initial: { nome: `${ev.nome} (copia)`, sottotitolo: ev.sottotitolo, immagine_url: ev.immagine_url },
                    })}
                    onDelete={() => deleteEvento(ev)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
