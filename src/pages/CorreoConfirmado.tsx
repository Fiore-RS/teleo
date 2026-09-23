import { useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '../assets/components/atoms/Button'

/** A donde llegan los enlaces de "Cambiar correo" (ver main.tsx). Supabase manda dos
 *  enlaces, uno a cada correo:
 *  - ?paso=1: se confirmó el primero y falta abrir el del otro correo.
 *  - sin paso: se confirmaron los dos y el correo ya cambió. */
export function CorreoConfirmado() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isHalfway = searchParams.get('paso') === '1'
  const Icon = isHalfway ? MailCheck : CheckCircle2

  return (
    <div className="min-h-screen bg-glow-top flex items-center justify-center p-6 text-center">
      <div className="animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-4">
          <Icon size={28} className="text-primary-text" />
        </div>
        <h1 className="font-display font-semibold text-display-md text-text">
          {isHalfway ? 'Vas a la mitad' : '¡Correo actualizado!'}
        </h1>
        <p className="text-body-md text-text-secondary mt-2 text-pretty">
          {isHalfway
            ? 'Confirmaste uno de los dos enlaces. Ahora abre el que llegó a tu otro correo para terminar el cambio.'
            : 'Desde ahora inicias sesión con tu correo nuevo.'}
        </p>
        <Button variant="primary" className="mt-6" onClick={() => navigate('/')}>Ir a Teleo</Button>
      </div>
    </div>
  )
}
