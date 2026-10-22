import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HeroIllustration } from '../assets/components/atoms/HeroIllustration'
import { Logo } from '../assets/components/atoms/Logo'
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

  return (
    <div className="min-h-screen bg-glow-top flex flex-col">
      <div className="p-4">
        <Logo variant="full" className="h-8" onClick={() => navigate('/')} />
      </div>

      {/* V.3.3.0: con invitación, la tarjeta flota encima de la ilustración, que conserva su
          tamaño. */}
      <div className="relative">
        <HeroIllustration className="w-full" />
        {inviter && (
          <div className="absolute inset-x-5 top-8 animate-float-in drop-shadow-[0_14px_18px_rgba(40,20,10,0.22)]">
            <InviterCard inviter={inviter} />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between p-6 pb-20">
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

        <div className="space-y-3 mt-8">
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
  )
}
