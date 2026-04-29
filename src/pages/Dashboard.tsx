import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, EyeOff, ConciergeBell, FileText, CircleDot, MoreVertical, ExternalLink, Pencil, Trash2, Salad, Leaf, MilkOff, ChefHat, Wheat, Egg, Nut, Milk, Fish, Shell, Bean, Sprout, FlaskConical, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog } from "@base-ui/react/dialog"
import { COLORS } from "../constants"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const navigate = useNavigate()
  const [ricettaOpen, setRicettaOpen] = useState(false)
  const [selectedPiatto, setSelectedPiatto] = useState<{ id: string; nome: string; categoria: string } | null>(null)
  const [modificaOpen, setModificaOpen] = useState(false)
  const [modificaPiatto, setModificaPiatto] = useState<{ id: string; nome: string; categoria: string } | null>(null)
  const [eliminaOpen, setEliminaOpen] = useState(false)

  const openElimina = (closeFn?: () => void) => {
    closeFn?.()
    setTimeout(() => setEliminaOpen(true), 0)
  }

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
        <aside className="w-50 flex flex-col border-r border-gray-300 gap-8 p-8" style={{ backgroundColor: COLORS.secondary }}>
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

          <button
            className="mt-auto w-full flex items-center text-sm rounded px-3 py-2 border transition-colors hover:bg-red-50"
            style={{ color: COLORS.accent, borderColor: COLORS.accent }}
            onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
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
                <Sheet>
                  <SheetTrigger className="h-10 border border-gray-300 px-4 py-2 rounded-lg flex items-center bg-white hover:bg-gray-50 text-sm font-medium transition-colors" style={{ color: COLORS.text }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo piatto
                  </SheetTrigger>
                  <SheetContent 
                    className="overflow-hidden bg-white p-0 flex flex-col"
                    style={{ width: '70vw', maxWidth: '70vw' }}
                  >
                    <div className="flex flex-col h-full pt-8">
                      <div className="flex-1 overflow-y-auto pr-4 pb-8">
                        {/* Nome piatto */}
                        <div className="flex flex-col gap-2 pb-8 border-b border-gray-200 px-8">
                          <div className="font-geist text-base">Nome piatto/Traduzioni</div>
                          <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
                            {['Italiano', 'Inglese', 'Tedesco', 'Francese'].map(lang => (
                              <div key={lang} className="flex items-center gap-4">
                                <label className="w-20 text-sm">{lang}</label>
                                <Input className="flex-1 bg-white border-none rounded-sm h-8" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tipologia */}
                        <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                          <div className="font-geist text-base">Tipologia</div>
                          <Select defaultValue="Primo">
                            <SelectTrigger className="w-full bg-gray-200 border-none rounded-md h-10 shadow-none ring-0 focus:ring-0 px-4">
                              <SelectValue placeholder="Seleziona tipologia" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-200 border-none shadow-none ring-0 rounded-md font-sans">
                              <SelectItem value="Primo" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Primo</SelectItem>
                              <SelectItem value="Secondo" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Secondo</SelectItem>
                              <SelectItem value="Contorno" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Contorno</SelectItem>
                              <SelectItem value="Dessert" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Dessert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Preparazione */}
                        <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                          <div className="font-geist text-base">Preparazione</div>
                          <Textarea className="w-full min-h-32 border-gray-300 resize-none rounded-md" />
                        </div>

                        {/* Caratteristiche e Allergeni */}
                        <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
                          <div className="flex flex-col gap-4">
                            <div className="font-geist text-base">Caratteristiche</div>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="veg" className="rounded-full" />
                                <label htmlFor="veg" className="flex items-center gap-2 text-sm">
                                  <Salad className="w-4 h-4" /> Vegetariano
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="vegan" className="rounded-full" />
                                <label htmlFor="vegan" className="flex items-center gap-2 text-sm">
                                  <Leaf className="w-4 h-4" /> Vegano
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="lactose" className="rounded-full" />
                                <label htmlFor="lactose" className="flex items-center gap-2 text-sm">
                                  <MilkOff className="w-4 h-4" /> Senza lattosio
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="km0" className="rounded-full" />
                                <label htmlFor="km0" className="flex items-center gap-2 text-sm">
                                  <ChefHat className="w-4 h-4" /> KM0
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <div className="font-geist text-base">Allergeni</div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="arachidi" className="rounded-full" />
                                <label htmlFor="arachidi" className="flex items-center gap-2 text-sm">
                                  <Nut className="w-4 h-4" /> Arachidi
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="crostacei" className="rounded-full" />
                                <label htmlFor="crostacei" className="flex items-center gap-2 text-sm">
                                  <Shell className="w-4 h-4" /> Crostacei
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="frutta-guscio" className="rounded-full" />
                                <label htmlFor="frutta-guscio" className="flex items-center gap-2 text-sm">
                                  <Nut className="w-4 h-4" /> Frutta a guscio
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="glutine" className="rounded-full" />
                                <label htmlFor="glutine" className="flex items-center gap-2 text-sm">
                                  <Wheat className="w-4 h-4" /> Glutine
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="latte" className="rounded-full" />
                                <label htmlFor="latte" className="flex items-center gap-2 text-sm">
                                  <Milk className="w-4 h-4" /> Latte
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="lupini" className="rounded-full" />
                                <label htmlFor="lupini" className="flex items-center gap-2 text-sm">
                                  <Bean className="w-4 h-4" /> Lupini
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="molluschi" className="rounded-full" />
                                <label htmlFor="molluschi" className="flex items-center gap-2 text-sm">
                                  <Shell className="w-4 h-4" /> Molluschi
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="senape" className="rounded-full" />
                                <label htmlFor="senape" className="flex items-center gap-2 text-sm">
                                  <Leaf className="w-4 h-4" /> Senape
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="pesce" className="rounded-full" />
                                <label htmlFor="pesce" className="flex items-center gap-2 text-sm">
                                  <Fish className="w-4 h-4" /> Pesce
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="sedano" className="rounded-full" />
                                <label htmlFor="sedano" className="flex items-center gap-2 text-sm">
                                  <Salad className="w-4 h-4" /> Sedano
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="sesamo" className="rounded-full" />
                                <label htmlFor="sesamo" className="flex items-center gap-2 text-sm">
                                  <Sprout className="w-4 h-4" /> Sesamo
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="solfiti" className="rounded-full" />
                                <label htmlFor="solfiti" className="flex items-center gap-2 text-sm">
                                  <FlaskConical className="w-4 h-4" /> Anidride solforosa e solfiti
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="uova" className="rounded-full" />
                                <label htmlFor="uova" className="flex items-center gap-2 text-sm">
                                  <Egg className="w-4 h-4" /> Uova
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="soia" className="rounded-full" />
                                <label htmlFor="soia" className="flex items-center gap-2 text-sm">
                                  <Bean className="w-4 h-4" /> Soia
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <SheetFooter className="border-t border-gray-200 pt-6 flex flex-row justify-between w-full items-center px-8">
                        <Button variant="outline" className="flex items-center h-10" style={{ borderColor: COLORS.accent, color: COLORS.accent }} onClick={() => openElimina()}>
                          <Trash2 className="w-4 h-4 mr-2" /> Elimina
                        </Button>
                        <div className="flex gap-4">
                          <button className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors" style={{ color: COLORS.text }}>
                            Annulla
                          </button>
                          <Button className="text-white h-10 hover:opacity-80" style={{ backgroundColor: COLORS.text }}>
                            Salva modifiche
                          </Button>
                        </div>
                      </SheetFooter>
                    </div>
                  </SheetContent>
                </Sheet>
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
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedPiatto(piatto); setTimeout(() => setRicettaOpen(true), 0) }}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          <span>Vedi ricetta</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => { setModificaPiatto(piatto); setTimeout(() => setModificaOpen(true), 0) }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Modifica</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer focus:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)]"
                          style={{ color: COLORS.accent, '--accent-color': COLORS.accent } as React.CSSProperties}
                          onClick={() => openElimina()}
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

      {/* Ricetta drawer — controlled via state from dropdown */}
      <Sheet open={ricettaOpen} onOpenChange={setRicettaOpen}>
        <SheetContent
          className="overflow-hidden bg-white p-0 flex flex-col"
          style={{ width: '70vw', maxWidth: '70vw' }}
        >
          <div className="flex flex-col h-full pt-8">
            <div className="flex-1 overflow-y-auto pb-8">

              {/* Intestazione */}
              <div className="flex flex-col gap-1 pb-8 border-b border-gray-200 px-8">
                <div className="text-sm text-gray-500 font-geist">{selectedPiatto?.id} · {selectedPiatto?.categoria}</div>
                <h2 className="text-3xl font-light font-fraunces">{selectedPiatto?.nome}</h2>
              </div>

              {/* Nome piatto / Traduzioni */}
              <div className="flex flex-col gap-2 mt-8 pb-8 border-b border-gray-200 px-8">
                <div className="font-geist text-base">Nome piatto / Traduzioni</div>
                <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
                  {[
                    { lang: 'Italiano', value: selectedPiatto?.nome ?? '' },
                    { lang: 'Inglese',  value: '' },
                    { lang: 'Tedesco',  value: '' },
                    { lang: 'Francese', value: '' },
                  ].map(({ lang, value }) => (
                    <div key={lang} className="flex items-center gap-4">
                      <span className="w-20 text-sm text-gray-500">{lang}</span>
                      <span className="flex-1 text-sm bg-white rounded-sm px-3 py-1.5 min-h-8">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipologia */}
              <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                <div className="font-geist text-base">Tipologia</div>
                <div className="bg-gray-200 rounded-md h-10 flex items-center px-4 font-semibold text-sm">
                  {selectedPiatto?.categoria}
                </div>
              </div>

              {/* Preparazione */}
              <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                <div className="font-geist text-base">Preparazione</div>
                <div className="w-full min-h-32 border border-gray-200 rounded-md p-3 text-sm text-gray-400 italic">
                  Nessuna preparazione inserita.
                </div>
              </div>

              {/* Caratteristiche e Allergeni */}
              <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
                <div className="flex flex-col gap-4">
                  <div className="font-geist text-base">Caratteristiche</div>
                  <div className="flex flex-col gap-3 text-sm text-gray-400 italic">
                    Nessuna caratteristica selezionata.
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="font-geist text-base">Allergeni</div>
                  <div className="flex flex-col gap-3 text-sm text-gray-400 italic">
                    Nessun allergene selezionato.
                  </div>
                </div>
              </div>

            </div>

            <SheetFooter className="border-t border-gray-200 pt-6 flex flex-row justify-between w-full items-center px-8">
              <Button variant="outline" className="flex items-center h-10" style={{ borderColor: COLORS.accent, color: COLORS.accent }} onClick={() => openElimina(() => setRicettaOpen(false))}>
                <Trash2 className="w-4 h-4 mr-2" /> Elimina
              </Button>
              <div className="flex gap-4">
                <button
                  className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
                  style={{ color: COLORS.text }}
                  onClick={() => setRicettaOpen(false)}
                >
                  Chiudi
                </button>
                <Button className="text-white h-10 hover:opacity-80" style={{ backgroundColor: COLORS.text }}>
                  <Pencil className="w-4 h-4 mr-2" /> Modifica
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modifica drawer — controlled via state from dropdown */}
      <Sheet open={modificaOpen} onOpenChange={setModificaOpen}>
        <SheetContent
          className="overflow-hidden bg-white p-0 flex flex-col"
          style={{ width: '70vw', maxWidth: '70vw' }}
        >
          <div className="flex flex-col h-full pt-8">
            <div className="flex-1 overflow-y-auto pr-4 pb-8">

              {/* Intestazione */}
              <div className="flex flex-col gap-1 pb-8 border-b border-gray-200 px-8">
                <div className="text-sm text-gray-500 font-geist">Modifica piatto</div>
                <h2 className="text-3xl font-light font-fraunces">{modificaPiatto?.nome}</h2>
                <div className="text-sm text-gray-500">{modificaPiatto?.id} - {modificaPiatto?.categoria}</div>
              </div>

              {/* Traduzioni */}
              <div className="flex flex-col gap-2 mt-8 pb-8 border-b border-gray-200 px-8">
                <div className="font-geist text-base">Traduzioni</div>
                <div className="bg-gray-200 p-4 rounded-lg flex flex-col gap-3">
                  {[
                    { lang: 'Italiano', value: modificaPiatto?.nome ?? '' },
                    { lang: 'Inglese',  value: '' },
                    { lang: 'Tedesco',  value: '' },
                    { lang: 'Francese', value: '' },
                  ].map(({ lang, value }) => (
                    <div key={lang} className="flex items-center gap-4">
                      <label className="w-20 text-sm">{lang}</label>
                      <Input defaultValue={value} className="flex-1 bg-white border-none rounded-sm h-8" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipologia */}
              <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                <div className="font-geist text-base">Tipologia</div>
                <Select defaultValue={modificaPiatto?.categoria ?? 'Primo'}>
                  <SelectTrigger className="w-full bg-gray-200 border-none rounded-md h-10 shadow-none ring-0 focus:ring-0 font-semibold px-4">
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-200 border-none shadow-none ring-0 rounded-md font-sans">
                    <SelectItem value="Primo" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Primo</SelectItem>
                    <SelectItem value="Secondo" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Secondo</SelectItem>
                    <SelectItem value="Contorno" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Contorno</SelectItem>
                    <SelectItem value="Dessert" className="hover:bg-gray-300 focus:bg-gray-300 cursor-pointer px-4 py-2">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preparazione */}
              <div className="flex flex-col gap-2 mt-8 px-8 border-b border-gray-200 pb-8">
                <div className="font-geist text-base">Preparazione</div>
                <Textarea className="w-full min-h-32 border-gray-300 resize-none rounded-md" />
              </div>

              {/* Caratteristiche e Allergeni */}
              <div className="grid grid-cols-2 gap-8 mt-8 px-8 pb-8">
                <div className="flex flex-col gap-4">
                  <div className="font-geist text-base">Caratteristiche</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-veg" className="rounded-full" />
                      <label htmlFor="m-veg" className="flex items-center gap-2 text-sm"><Salad className="w-4 h-4" /> Vegetariano</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-vegan" className="rounded-full" />
                      <label htmlFor="m-vegan" className="flex items-center gap-2 text-sm"><Leaf className="w-4 h-4" /> Vegano</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-lactose" className="rounded-full" />
                      <label htmlFor="m-lactose" className="flex items-center gap-2 text-sm"><MilkOff className="w-4 h-4" /> Senza lattosio</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-km0" className="rounded-full" />
                      <label htmlFor="m-km0" className="flex items-center gap-2 text-sm"><ChefHat className="w-4 h-4" /> KM0</label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="font-geist text-base">Allergeni</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-arachidi" className="rounded-full" />
                      <label htmlFor="m-arachidi" className="flex items-center gap-2 text-sm"><Nut className="w-4 h-4" /> Arachidi</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-crostacei" className="rounded-full" />
                      <label htmlFor="m-crostacei" className="flex items-center gap-2 text-sm"><Shell className="w-4 h-4" /> Crostacei</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-frutta-guscio" className="rounded-full" />
                      <label htmlFor="m-frutta-guscio" className="flex items-center gap-2 text-sm"><Nut className="w-4 h-4" /> Frutta a guscio</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-glutine" className="rounded-full" />
                      <label htmlFor="m-glutine" className="flex items-center gap-2 text-sm"><Wheat className="w-4 h-4" /> Glutine</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-latte" className="rounded-full" />
                      <label htmlFor="m-latte" className="flex items-center gap-2 text-sm"><Milk className="w-4 h-4" /> Latte</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-lupini" className="rounded-full" />
                      <label htmlFor="m-lupini" className="flex items-center gap-2 text-sm"><Bean className="w-4 h-4" /> Lupini</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-molluschi" className="rounded-full" />
                      <label htmlFor="m-molluschi" className="flex items-center gap-2 text-sm"><Shell className="w-4 h-4" /> Molluschi</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-senape" className="rounded-full" />
                      <label htmlFor="m-senape" className="flex items-center gap-2 text-sm"><Leaf className="w-4 h-4" /> Senape</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-pesce" className="rounded-full" />
                      <label htmlFor="m-pesce" className="flex items-center gap-2 text-sm"><Fish className="w-4 h-4" /> Pesce</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-sedano" className="rounded-full" />
                      <label htmlFor="m-sedano" className="flex items-center gap-2 text-sm"><Salad className="w-4 h-4" /> Sedano</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-sesamo" className="rounded-full" />
                      <label htmlFor="m-sesamo" className="flex items-center gap-2 text-sm"><Sprout className="w-4 h-4" /> Sesamo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-solfiti" className="rounded-full" />
                      <label htmlFor="m-solfiti" className="flex items-center gap-2 text-sm"><FlaskConical className="w-4 h-4" /> Anidride solforosa e solfiti</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-uova" className="rounded-full" />
                      <label htmlFor="m-uova" className="flex items-center gap-2 text-sm"><Egg className="w-4 h-4" /> Uova</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="m-soia" className="rounded-full" />
                      <label htmlFor="m-soia" className="flex items-center gap-2 text-sm"><Bean className="w-4 h-4" /> Soia</label>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <SheetFooter className="border-t border-gray-200 pt-6 flex flex-row justify-between w-full items-center px-8">
              <Button variant="outline" className="flex items-center h-10" style={{ borderColor: COLORS.accent, color: COLORS.accent }} onClick={() => openElimina(() => setModificaOpen(false))}>
                <Trash2 className="w-4 h-4 mr-2" /> Elimina
              </Button>
              <div className="flex gap-4">
                <button
                  className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
                  style={{ color: COLORS.text }}
                  onClick={() => setModificaOpen(false)}
                >
                  Annulla
                </button>
                <Button className="text-white h-10 hover:opacity-80" style={{ backgroundColor: COLORS.text }}>
                  Salva modifiche
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Conferma eliminazione */}
      <Dialog.Root open={eliminaOpen} onOpenChange={setEliminaOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col gap-4">
            <Dialog.Title className="text-lg font-semibold" style={{ color: COLORS.text }}>
              Sei sicuro di voler eliminare il piatto?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              Questa azione non è reversibile. Cancellerai permanentemente il piatto
            </Dialog.Description>
            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close render={
                <button className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors" style={{ color: COLORS.text }}>
                  Annulla
                </button>
              } />
              <button
                className="h-10 px-4 py-2 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: COLORS.accent }}
                onClick={() => setEliminaOpen(false)}
              >
                Elimina
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
