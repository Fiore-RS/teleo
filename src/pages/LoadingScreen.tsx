import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logoIconDark from '../assets/images/logo/logo-icon-dark.svg'

const MIN_SPLASH_MS = 2000

export function LoadingScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const start = Date.now()

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const elapsed = Date.now() - start
      const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)

      setTimeout(() => {
        if (!isMounted) return
        if (data.session) {
          navigate('/mesa', { replace: true })
        } else {
          navigate('/inicio', { replace: true })
        }
      }, remaining)
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-accent-wishlist flex items-center justify-center">
      <img src={logoIconDark} alt="Teleo" className="w-24 h-24 animate-pulse" />
    </div>
  )
}