import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { supabase } from './lib/supabase'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import './index.css'
// Empieza a escuchar el aviso de instalación desde que carga la app (ver lib/installPrompt.ts).
import './lib/installPrompt'

// Al cerrar sesión se vacía la caché de datos, para que otra cuenta en el mismo dispositivo
// nunca vea (ni por un instante) los datos de la anterior.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') queryClient.clear()
})

// Enlace de "¿Olvidaste tu contraseña?". Supabase vuelve a la raíz con sus datos en el "#"
// (#access_token=...&type=recovery), que el HashRouter no entiende como ruta. Se lee ahora,
// antes de que Supabase lo borre, y cuando termina de abrir la sesión se lleva a la pantalla
// de contraseña nueva. Si el enlace venció o ya se usó, Supabase manda un error_code en su
// lugar y se vuelve a "¿Olvidaste tu contraseña?" con el aviso.
const authHash = window.location.hash
if (authHash.includes('type=recovery')) {
  supabase.auth.getSession().then(({ data }) => {
    window.location.hash = data.session ? '#/nueva-contrasena' : '#/recuperar-contrasena?expirado=1'
  })
} else if (!authHash.startsWith('#/') && /error_code=(otp_expired|access_denied)/.test(authHash)) {
  // Solo cuando el "#" no trae ruta: así no se confunde con otros enlaces de Supabase, como
  // el de confirmar la cuenta, que vuelve a #/login.
  window.location.hash = '#/recuperar-contrasena?expirado=1'
} else if (authHash.startsWith('#message=')) {
  // Cambiar correo, primer enlace: Supabase vuelve con #message=Confirmation+link+accepted...
  // y el HashRouter lo tomaba como una ruta inexistente (pantalla en blanco).
  window.location.hash = '#/correo-confirmado?paso=1'
} else if (authHash.includes('type=email_change')) {
  // Cambiar correo, segundo enlace: se espera a que Supabase guarde la sesión nueva.
  supabase.auth.getSession().then(() => {
    window.location.hash = '#/correo-confirmado'
  })
} else if (authHash && !authHash.startsWith('#/') && authHash.includes('access_token=')) {
  // Cualquier otro enlace de Supabase sin ruta: se abre la sesión y se va al inicio.
  supabase.auth.getSession().then(() => {
    window.location.hash = '#/'
  })
}

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