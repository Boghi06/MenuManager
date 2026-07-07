import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clientConfig } from '@/config/clients'
import { applyTheme } from '@/core/theme/applyTheme'

applyTheme(clientConfig)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
