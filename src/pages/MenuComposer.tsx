import { useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { MESI } from '@/constants/mesi'

export default function MenuComposer() {
  const { anno, mese, bisett } = useParams()

  return (
    <AppLayout showCategorie={false}>
      <div className="p-8">
        <h1 className="text-4xl font-light font-fraunces">
          Composizione menù — {MESI[Number(mese) - 1]} {anno} · Bisettimana {bisett === '1' ? 'A' : 'B'}
        </h1>
        <p className="text-gray-500 mt-4">Schermata da implementare nel prossimo handoff.</p>
      </div>
    </AppLayout>
  )
}
