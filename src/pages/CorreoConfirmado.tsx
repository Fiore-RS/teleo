import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../assets/components/atoms/Button'
import { AuthLayout } from '../assets/components/molecules/AuthLayout'

/** A donde llegan los enlaces de "Cambiar correo" (ver main.tsx). Supabase manda dos
 *  enlaces, uno a cada correo:
 *  - ?paso=1: se confirmó el primero y falta abrir el del otro correo.
 *  - sin paso: se confirmaron los dos y el correo ya cambió.
 *  V.3.3.0: sin el círculo con ícono, como el resto de los avisos. */
export function CorreoConfirmado() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isHalfway = searchParams.get('paso') === '1'

  return (
    <AuthLayout
      centered
      title={isHalfway ? 'Vas a la mitad' : '¡Correo actualizado!'}
      subtitle={
        isHalfway
          ? 'Confirmaste uno de los dos enlaces. Ahora abre el que llegó a tu otro correo para terminar el cambio.'
          : 'Desde ahora inicias sesión con tu correo nuevo.'
      }
      footer={
        <Button variant="primary" onClick={() => navigate('/')}>
          Ir a Teleo
        </Button>
      }
    />
  )
}
