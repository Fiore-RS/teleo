import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TapaPortada, TapaPortadaCelular } from '../assets/components/molecules/TapaPortada'
import { Button } from '../assets/components/atoms/Button'
import { InviterCard } from '../assets/components/molecules/InviterCard'
import { useInviterPreview } from '../hooks/useInviterPreview'
import { readInviteCode, saveInviteCode } from '../lib/invite'

export function Inicio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // V.3.3.0: si se llega con una invitación (#/inicio?codigo=...), el código se guarda para
  // Registro. Sin código en el enlace, se usa el que ya se guardó en esta visita.
  const [inviteCode] = useState(() => saveInviteCode(searchParams.get('codigo')) ?? readInviteCode())
  const { inviter } = useInviterPreview(inviteCode)

  // Tableta y computadora (V.4.3.0): la tapa del cuaderno a la izquierda, sin la ilustración, y
  // el texto con los botones a la derecha (como las demás pantallas de cuenta, AuthLayout).
  // Celular (V.4.5.0): la tapa arriba, de lado a lado, en lugar del logo y la ilustración.
  return (
    <div className="min-h-screen bg-glow-top tableta:grid tableta:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] escritorio:grid-cols-[600px_minmax(0,1fr)]">
      <div className="hidden tableta:block sticky top-0 h-dvh">
        <TapaPortada />
      </div>
      <div className="min-h-screen flex flex-col tableta:justify-center tableta:mx-auto tableta:w-full tableta:max-w-[468px]">
      <div className="tableta:hidden">
        <TapaPortadaCelular larga />
      </div>

      {/* V.3.3.0: con invitación, la tarjeta de quien invita va arriba del título (en el celular,
          desde la V.4.5.0, debajo de la tapa). */}
      {inviter && (
        <div className="px-6 pt-6 tableta:pt-0 animate-float-in drop-shadow-[0_14px_18px_rgba(40,20,10,0.22)]">
          <InviterCard inviter={inviter} />
        </div>
      )}

      {/* Los botones van justo después del texto (V.4.5.0): con la tapa arriba, empujarlos al
          fondo dejaba un hueco grande en medio. */}
      <div className="flex flex-col p-6 pt-8 pb-10 tableta:pb-6">
        <div>
          <h1 className="font-title leading-none text-text">
            <span className="text-[clamp(40px,12vw,56px)]">Teleo,</span>{' '}
            <span className="text-[clamp(24px,7vw,32px)] text-text-secondary">a mi manera</span>
          </h1>
          <p className="font-body text-body-lg text-text-secondary mt-4">
            Tu rincón personal para leer, reflexionar y conectar con los libros que amas.
            Un espacio íntimo diseñado para la lectura consciente.
          </p>
        </div>

        <div className="space-y-3 mt-10">
          <Button variant="primary" onClick={() => navigate('/registro')}>
            Crear cuenta gratis
          </Button>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
          <p className="text-center text-body-sm text-text-secondary mt-2">
            Sin ads, sin rastreo; tu privacidad es sagrada
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
