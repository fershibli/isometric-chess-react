import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Base tokens and the shared button/plank styles load first, so component
// stylesheets can build on them instead of racing them for the cascade.
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
