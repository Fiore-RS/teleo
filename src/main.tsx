import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './index.css'

// Al cerrar sesión se vacía la caché de datos, para que otra cuenta en el mismo dispositivo
// nunca vea (ni por un instante) los datos de la anterior.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') queryClient.clear()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>,
)