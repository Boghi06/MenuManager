import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { COLORS } from "../constants"

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: COLORS.primary }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        <img src="/LOGO.svg" alt="Hotel Garden Terme" className="w-150 h-auto" />

        <form
          className="w-full flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            navigate('/dashboard')
          }}
        >
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Username"
              className="pl-11 h-12 rounded-full border-gray-300 font-sans bg-white"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              placeholder="Password"
              className="pl-11 h-12 rounded-full border-gray-300 font-sans bg-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full hover:opacity-80 transition-opacity font-sans mt-1"
            style={{ backgroundColor: COLORS.text, color: COLORS.primary }}
          >
            Accedi
          </Button>
        </form>
      </div>
    </div>
  )
}
