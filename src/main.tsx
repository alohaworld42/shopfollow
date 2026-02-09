import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode was removed because it causes AbortErrors with Supabase
// due to double-mounting in development. The app works correctly without it.
createRoot(document.getElementById('root')!).render(
  <App />
)
