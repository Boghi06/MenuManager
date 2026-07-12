import { useState } from "react"
import { Input } from "@/core/ui/input"
import { Button } from "@/core/ui/button"
import { User, Lock, AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { clientConfig } from "@/config/clients"
import { supabase } from "@/core/lib/supabase"
import { loginInputToEmail } from "./username"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginInputToEmail(username),
      password,
    })

    if (error) {
      setError("Credenziali non valide. Riprova.")
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-canvas">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <img src={clientConfig.logo} alt={clientConfig.appName} className="w-150 h-auto" />

        <form className="w-full flex flex-col gap-3" onSubmit={handleLogin}>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Nome utente"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="pl-11 h-12 rounded-full border-gray-300 font-sans bg-white"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
      </div>
    </div>
  )
}
