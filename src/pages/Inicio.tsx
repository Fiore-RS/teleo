import { useNavigate } from 'react-router-dom'
import { HeroIllustration } from '../assets/components/atoms/HeroIllustration'
import { Logo } from '../assets/components/atoms/Logo'
import { Button } from '../assets/components/atoms/Button'

export function Inicio() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-glow-top flex flex-col">
      <div className="p-4">
        <Logo variant="full" className="h-8" onClick={() => navigate('/')} />
      </div>

      <HeroIllustration className="w-full" />

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