import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { Button } from '../atoms/Button'

/** V.3.3.0: aviso arriba de La mesa en la cuenta de visitante. Explica que todo se reinicia y
 *  ofrece crear una cuenta propia (cierra la sesión de prueba y abre el registro). */
export function DemoNotice() {
  const navigate = useNavigate()

  async function handleCreateAccount() {
    await supabase.auth.signOut()
    navigate('/registro')
  }

  return (
    <section
      aria-label="Cuenta de prueba"
      className="bg-surface border border-border rounded-card shadow-card px-4.5 py-4"
    >
      <p className="font-display font-semibold text-body-lg text-text">Estás en la cuenta de prueba</p>
      <p className="text-body-md text-text-secondary mt-1">
        Explora con libertad: lo que cambies se borra cada noche y la biblioteca vuelve a como estaba.
      </p>
      <Button variant="soft" className="mt-3.5" onClick={handleCreateAccount}>
        Crear mi cuenta
      </Button>
    </section>
  )
}
