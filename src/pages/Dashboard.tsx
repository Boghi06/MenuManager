import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, EyeOff, ConciergeBell, FileText, Circle, CircleDot, MoreVertical, ExternalLink, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { COLORS } from "../constants"

export default function Dashboard() {
  const piatti = [
    {
      id: "001",
      nome: "Zuppa di fagioli di Lamon all'olio di oliva",
      categoria: "Primo"
    },
    {
      id: "002",
      nome: "Sogliola di Dover rosolata alla mugnaia con vino bianco e limone",
      categoria: "Secondo"
    },
    {
      id: "003",
      nome: "Consommé di manzo con stracciatella d'uovo",
      categoria: "Contorno"
    },
    {
      id: "004",
      nome: "Capretto giovane al forno agli aromi freschi Mediterranei",
      categoria: "Dolce"
    },
    {
      id: "005",
      nome: "Tiramisù classico con savoiardi artigianali",
      categoria: "Dessert"
    }
  ]

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
      {/* Header spanning full width */}
      <header className="h-20 flex items-center justify-between px-8 py-4 flex-shrink-0" style={{ backgroundColor: COLORS.secondary }}>
        <img src="/LOGO.svg" alt="Hotel Garden Terme" className="h-12 w-auto" />
        <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-xl font-fraunces" style={{ backgroundColor: COLORS.text }}>
          GG
        </div>
      </header>

      {/* Body Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-50 flex flex-col border-r border-gray-300 overflow-y-auto gap-8 p-8" style={{ backgroundColor: COLORS.secondary }}>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold uppercase font-geist">Opzioni</h3>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <ConciergeBell className="w-6 h-6 mr-2" />
              Elenco Piatti
            </button>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <FileText className="w-6 h-6 mr-2" />
              Menú
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold uppercase font-geist">Categorie</h3>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <CircleDot className="w-4 h-4 mr-2" style={{ color: COLORS.accent }} />
              Tutti i piatti
            </button>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <CircleDot className="w-4 h-4 mr-2" />
              Primi
            </button>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <CircleDot className="w-4 h-4 mr-2" />
              Secondi
            </button>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <CircleDot className="w-4 h-4 mr-2" />
              Contorni
            </button>
            <button className="w-full flex items-center text-sm rounded" style={{ color: COLORS.text }}>
              <CircleDot className="w-4 h-4 mr-2" />
              Dessert
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: COLORS.primary }}>
          <div className="w-full pt-8 flex-shrink-0">
            <div className="flex flex-col gap-4 px-8 pb-4 border-b border-gray-200">
              <div className="text-base font-geist">249 Piatti</div>
              <h1 className="text-5xl font-light font-fraunces">
                Elenco <span className="italic font-normal underline decoration-2 underline-offset-4 " style={{ textDecorationColor: COLORS.accent }}>Piatti</span>
              </h1>
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: COLORS.text }} />
                  <Input
                    type="text"
                    placeholder="Cerca"
                    className="pl-9 h-10 border-gray-300 rounded-lg"
                  />
                </div>
                <Button variant="outline" className="h-10 border-gray-300 rounded-lg flex items-center bg-white hover:bg-gray-50" style={{ color: COLORS.text }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo piatto
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {piatti.map((piatto) => (
              <div key={piatto.id} className="relative border-b border-gray-200 py-6 group hover:bg-gray-50 transition-colors">
                <div className="flex px-8">
                  <div className="flex flex-1">
                    <div className="w-1 mr-4 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS.text }}></div>
                    <div className="flex-1 pr-12">
                      <h2 className="text-xl font-serif mb-1" style={{ color: COLORS.text }}>{piatto.nome}</h2>
                      <p className="text-sm text-gray-500 mb-2 font-sans">{piatto.id} - {piatto.categoria}</p>
                      <button className="hover:text-gray-600 transition-colors" style={{ color: COLORS.text }}>
                        <EyeOff className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Menu a tre puntini in alto a destra */}
                <div 
                  className="absolute top-4 right-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 hover:bg-gray-200 rounded-md outline-none focus:outline-none opacity-0 group-hover:opacity-100 data-popup-open:opacity-100 data-open:opacity-100 transition-opacity">
                      <MoreVertical className="w-5 h-5" style={{ color: COLORS.text }} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 font-sans">
                      <DropdownMenuGroup>
                        <DropdownMenuItem className="cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span>Vedi ricetta</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Modifica</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer focus:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)]" 
                          style={{ 
                            color: COLORS.accent,
                            '--accent-color': COLORS.accent
                          } as React.CSSProperties}
                        >
                          <Trash2 className="mr-2 h-4 w-4" style={{ color: COLORS.accent }} />
                          <span>Elimina</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
