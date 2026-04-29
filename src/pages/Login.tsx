import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Lock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { COLORS } from "../constants"

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: COLORS.primary }}>
      <div className="w-full max-w-md flex flex-col items-center space-y-12">
        <img src="/LOGO.svg" alt="Hotel Garden Terme" className="w-64 h-auto" />
        
        <form 
          className="w-full space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            navigate('/dashboard')
          }}
        >
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Username" 
              className="pl-10 h-12 rounded-lg border-gray-300 font-sans"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="password" 
              placeholder="Password" 
              className="pl-10 h-12 rounded-lg border-gray-300 font-sans"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg hover:bg-black/90 transition-colors font-sans"
            style={{ backgroundColor: '#000000', color: COLORS.primary }}
          >
            Accedi
          </Button>
        </form>
      </div>
    </div>
  )
}
