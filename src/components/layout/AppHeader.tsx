import { COLORS } from '@/constants'

export function AppHeader() {
  return (
    <header
      className="h-20 flex items-center justify-between px-8 py-4 shrink-0"
      style={{ backgroundColor: COLORS.secondary }}
    >
      <img src="/LOGO.svg" alt="Hotel Garden Terme" className="h-12 w-auto" />
      <div
        className="w-10 h-10 rounded-full text-white flex items-center justify-center text-xl font-fraunces"
        style={{ backgroundColor: COLORS.text }}
      >
        GG
      </div>
    </header>
  )
}
