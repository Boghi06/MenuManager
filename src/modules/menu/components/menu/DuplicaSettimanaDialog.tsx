import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/ui/select'
import { MESI } from '@/modules/menu/constants/mesi'
import { getBisettimanaRange, formatBisettimanaRange } from '@/modules/menu/lib/bisettimane'
import { useDuplicaSettimana, type SettimanaRef } from '@/modules/menu/hooks/useDuplicaSettimana'

interface DuplicaSettimanaDialogProps {
  open: boolean
  onClose: () => void
  /** Anno mostrato nel planner: è la destinazione e il default della sorgente. */
  annoCorrente: number
  /** Anni esistenti, per il select dell'anno sorgente. */
  anniDisponibili: number[]
  /** Chiamata dopo una duplicazione riuscita, per rinfrescare il planner. */
  onDone: () => void
}

/** "Lun 14 – Dom 20" per la settimana indicata. */
function rangeSettimana(anno: number, mese: number, idx: 1 | 2, settimana: 1 | 2): string {
  const base = getBisettimanaRange(anno, mese, idx).start
  const start = new Date(base)
  start.setDate(start.getDate() + (settimana - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return formatBisettimanaRange({ start, end })
}

const triggerCls = 'w-full h-9 bg-white border-gray-300 rounded-md px-3 text-sm font-normal'

export function DuplicaSettimanaDialog({
  open, onClose, annoCorrente, anniDisponibili, onDone,
}: DuplicaSettimanaDialogProps) {
  const { duplica, loading, error } = useDuplicaSettimana()

  const [src, setSrc] = useState<SettimanaRef>({ anno: annoCorrente, mese: 1, idx: 1, settimana: 1 })
  const [dstMese, setDstMese] = useState(1)
  const [dstIdx, setDstIdx] = useState<1 | 2>(1)
  const [dstSett, setDstSett] = useState<1 | 2>(1)

  const [confirmCount, setConfirmCount] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const dst: SettimanaRef = { anno: annoCorrente, mese: dstMese, idx: dstIdx, settimana: dstSett }

  const stessaSettimana =
    src.anno === dst.anno && src.mese === dst.mese && src.idx === dst.idx && src.settimana === dst.settimana

  function reset() {
    setConfirmCount(null)
    setLocalError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function esegui(force: boolean) {
    setLocalError(null)
    try {
      const esito = await duplica(src, dst, force)
      if (esito.status === 'empty') {
        setLocalError('La settimana sorgente è vuota: non c\'è nulla da copiare.')
        return
      }
      if (esito.status === 'needs-confirm') {
        setConfirmCount(esito.vociDestinazione)
        return
      }
      // done
      onDone()
      handleClose()
    } catch {
      /* error già impostato nell'hook */
    }
  }

  const erroreVisibile = localError ?? error

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 flex flex-col gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500 mb-1">
                Pianificazione menù
              </p>
              <Dialog.Title className="font-fraunces text-3xl font-light text-black">
                Duplica settimana
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Copia i piatti di una settimana (pranzo e cena, tutti i giorni) in un'altra settimana del {annoCorrente}.
              </Dialog.Description>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              {/* Sorgente */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sorgente</p>
                <Field label="Anno">
                  <Select value={String(src.anno)} onValueChange={v => setSrc(s => ({ ...s, anno: Number(v) }))}>
                    <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {anniDisponibili.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Mese">
                  <Select value={String(src.mese)} onValueChange={v => setSrc(s => ({ ...s, mese: Number(v) }))}>
                    <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MESI.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Bisettimana">
                    <Select value={String(src.idx)} onValueChange={v => setSrc(s => ({ ...s, idx: Number(v) as 1 | 2 }))}>
                      <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">A</SelectItem>
                        <SelectItem value="2">B</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Settimana">
                    <Select value={String(src.settimana)} onValueChange={v => setSrc(s => ({ ...s, settimana: Number(v) as 1 | 2 }))}>
                      <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Sett. 1</SelectItem>
                        <SelectItem value="2">Sett. 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <p className="text-xs text-gray-500">{rangeSettimana(src.anno, src.mese, src.idx, src.settimana)}</p>
              </div>

              <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />

              {/* Destinazione */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Destinazione · {annoCorrente}
                </p>
                <Field label="Mese">
                  <Select value={String(dstMese)} onValueChange={v => setDstMese(Number(v))}>
                    <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MESI.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Bisettimana">
                    <Select value={String(dstIdx)} onValueChange={v => setDstIdx(Number(v) as 1 | 2)}>
                      <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">A</SelectItem>
                        <SelectItem value="2">B</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Settimana">
                    <Select value={String(dstSett)} onValueChange={v => setDstSett(Number(v) as 1 | 2)}>
                      <SelectTrigger className={triggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Sett. 1</SelectItem>
                        <SelectItem value="2">Sett. 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <p className="text-xs text-gray-500">{rangeSettimana(dst.anno, dst.mese, dst.idx, dst.settimana)}</p>
              </div>
            </div>

            {stessaSettimana && (
              <p className="text-xs text-gray-500 -mt-2">Sorgente e destinazione coincidono: scegli una settimana diversa.</p>
            )}
            {erroreVisibile && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{erroreVisibile}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="h-10 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => esegui(false)}
                disabled={loading || stessaSettimana}
                className="h-10 px-4 rounded-md bg-gray-900 text-white text-sm font-medium transition-colors
                           enabled:hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Duplicazione…' : 'Duplica'}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Conferma sovrascrittura: la destinazione contiene già dei piatti */}
      <Dialog.Root open={confirmCount !== null} onOpenChange={(o) => { if (!o) setConfirmCount(null) }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/40" />
          <Dialog.Popup className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B23A1F] shrink-0 mt-0.5" />
              <div>
                <Dialog.Title className="text-lg font-semibold text-black">
                  La settimana di destinazione non è vuota
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  Contiene già {confirmCount} {confirmCount === 1 ? 'piatto' : 'piatti'}. Duplicando, questi verranno
                  sostituiti dai piatti della settimana sorgente. L'azione non è reversibile.
                </Dialog.Description>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setConfirmCount(null)}
                className="h-10 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => { setConfirmCount(null); void esegui(true) }}
                disabled={loading}
                className="h-10 px-4 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: '#B23A1F' }}
              >
                Sovrascrivi
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children}
    </label>
  )
}
