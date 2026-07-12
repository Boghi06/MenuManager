import { useState, type ReactNode } from 'react'
import { Lock, AlertCircle, LogOut } from 'lucide-react'
import { Input } from '@/core/ui/input'
import { Button } from '@/core/ui/button'
import { clientConfig } from '@/config/clients'
import { supabase } from '@/core/lib/supabase'
import { changeOwnPassword } from './adminUsers'
import { usePasswordChange } from './roles'

/**
 * Schermata di cambio password obbligatorio al primo accesso: sostituisce
 * l'intera app finché l'utente non imposta una nuova password.
 */
function ForcePasswordChange() {
  const { clear } = usePasswordChange()
  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('La password deve avere almeno 8 caratteri.'); return }
    if (password !== conferma) { setError('Le due password non coincidono.'); return }

    setLoading(true)
    setError(null)
    const err = await changeOwnPassword(password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    // Sblocca l'app: il flag è stato azzerato lato server.
    clear()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-canvas">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <img src={clientConfig.logo} alt={clientConfig.appName} className="w-150 h-auto" />

        <div className="text-center">
          <h1 className="text-2xl font-fraunces font-light mb-1">Cambia la password</h1>
          <p className="text-sm text-gray-500">
            Al primo accesso devi sostituire la password iniziale con una tua.
          </p>
        </div>

        <form className="w-full flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Nuova password (min 8 caratteri)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-11 h-12 rounded-full border-gray-300 font-sans bg-white"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Ripeti la nuova password"
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              required
              className="pl-11 h-12 rounded-full border-gray-300 font-sans bg-white"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-base px-2 text-brand">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full hover:opacity-80 transition-opacity font-sans mt-1 disabled:opacity-50 bg-brand-ink text-brand-canvas"
          >
            {loading ? 'Salvataggio…' : 'Salva e continua'}
          </Button>
        </form>

        <button
          onClick={async () => { await supabase.auth.signOut() }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </div>
    </div>
  )
}

/**
 * Blocca l'app con la schermata di cambio password finché il primo accesso
 * non è completato; altrimenti mostra i figli (l'app normale).
 */
export function PasswordChangeGate({ children }: { children: ReactNode }) {
  const { required } = usePasswordChange()
  if (required) return <ForcePasswordChange />
  return <>{children}</>
}
