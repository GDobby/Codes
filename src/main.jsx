import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VirtualTree from './components/VirtualTree'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VirtualTree />
  </StrictMode>,
)
