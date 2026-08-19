import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, BookOpen, NotebookPen, User, type LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Logo } from '../assets/components/atoms/Logo'
import { Button } from '../assets/components/atoms/Button'

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: Coffee,
    title: 'Mesa',
    description: 'Tu punto de partida diario: lo que estás leyendo ahora, tu racha de lectura y tu meta anual.',
  },
  {
    icon: BookOpen,
    title: 'Estante',
    description: 'Tu librería privada. Agrega libros y sagas, organízalos y filtra por estado, idioma, categoría o formato.',
  },
  {
    icon: NotebookPen,
    title: 'Cuaderno',
    description: 'Tu diario de lectura: escribe reseñas, califica tus lecturas y guarda tus citas favoritas.',
  },
  {
    icon: User,
    title: 'Perfil',
    description: 'Tu rincón personal: estadísticas, logros y las secciones que decidas compartir con otros.',
  },
]

export function Bienvenida() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateProfile } = useProfile(user?.id)
  const [isSaving, setIsSaving] = useState(false)

  async function handleStart() {
    setIsSaving(true)
    await updateProfile({ has_seen_intro: true })
    setIsSaving(false)
    navigate('/mesa', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col p-6">
      <div className="text-center mt-4">
        <Logo variant="icon" className="h-12 mx-auto" />
        <h1 className="font-display italic text-display-lg text-text mt-4">
          ¡Bienvenida a Teleo!
        </h1>
        <p className="font-body text-body-md text-text-secondary mt-2">
          Un vistazo rápido antes de empezar a construir tu rincón de lectura.
        </p>
      </div>

      <div className="flex-1 space-y-4 mt-8">
        {steps.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4 bg-surface border border-border rounded-2xl p-4">
            <div className="w-11 h-11 shrink-0 rounded-full bg-accent-wishlist flex items-center justify-center">
              <Icon size={20} className="text-surface" />
            </div>
            <div>
              <h3 className="font-display italic text-display-md text-accent-wishlist">{title}</h3>
              <p className="text-body-sm text-text-secondary mt-1">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" className="mt-6" onClick={handleStart} isLoading={isSaving}>
        Empezar a leer
      </Button>
    </div>
  )
}
