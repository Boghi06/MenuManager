import { Plus } from 'lucide-react'
import { PiattoSlot } from './PiattoSlot'
import type { CategoriaPiatto } from '@/modules/menu/types/piatto'

interface SecondoBlockProps {
  nome: string
  piattoId: number
  /** Categoria del secondo, per il colore della barra. */
  categoria?: CategoriaPiatto | null
  /** Nome del contorno assegnato, o null se assente. */
  contornoNome: string | null
  /** Id del contorno: serve ad aprirne la scheda, il nome da solo non basta. */
  contornoId?: number | null
  /** Categoria del contorno, per il colore della sua barra. */
  contornoCategoria?: CategoriaPiatto | null
  /** Sola visualizzazione: niente rimozione né slot contorno vuoto. */
  readOnly?: boolean
  onRemove: () => void
  onAddContorno: () => void
  onRemoveContorno: () => void
  /** Apre la scheda del piatto (secondo o contorno) nell'elenco piatti. */
  onOpenPiatto?: (piattoId: number) => void
}

/**
 * Un'alternativa di secondo col suo contorno (opzionale, 0 o 1):
 * card secondo + sotto, indentato, lo slot contorno.
 */
export function SecondoBlock({
  nome, piattoId, categoria, contornoNome, contornoId, contornoCategoria, readOnly = false,
  onRemove, onAddContorno, onRemoveContorno, onOpenPiatto,
}: SecondoBlockProps) {
  const apriSecondo = onOpenPiatto ? () => onOpenPiatto(piattoId) : undefined
  const apriContorno = onOpenPiatto && contornoId != null ? () => onOpenPiatto(contornoId) : undefined

  // in sola lettura senza contorno non serve mostrare lo slot vuoto
  if (readOnly && !contornoNome) {
    return <PiattoSlot nome={nome} piattoId={piattoId} tipo="secondi" categoria={categoria} onClick={apriSecondo} />
  }

  return (
    <div className="flex flex-col gap-1">
      <PiattoSlot nome={nome} piattoId={piattoId} tipo="secondi" categoria={categoria} onClick={apriSecondo} onRemove={readOnly ? undefined : onRemove} />

      {/* contorno annidato — esattamente 0 o 1 per secondo */}
      <div className="ml-3.5 pl-2.5 border-l border-[#D4D4D4]">
        {contornoNome ? (
          <PiattoSlot nome={contornoNome} tipo="contorni" categoria={contornoCategoria} compact onClick={apriContorno} onRemove={readOnly ? undefined : onRemoveContorno} />
        ) : (
          <button
            type="button"
            onClick={onAddContorno}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 border border-dashed border-[#D4D4D4]
                       bg-transparent text-gray-500 rounded text-xs transition-colors
                       hover:border-gray-400 hover:text-black"
          >
            <Plus className="w-3.5 h-3.5 text-gray-400" />
            contorno
          </button>
        )}
      </div>
    </div>
  )
}
