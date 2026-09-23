import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, BookOpen, NotebookPen, ScrollText, User, type LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import logoIconDark from '../assets/images/logo/logo-icon-dark.svg'
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
    icon: ScrollText,
    title: 'Bitácora',
    description: 'Tu historia con la lectura en números: racha, calendario, colección, calificaciones y el valor de tu biblioteca.',
  },
  {
    icon: User,
    title: 'Perfil',
    description: 'Tu rincón personal: tu meta anual, lo que estás leyendo, tus favoritos y recomendados, y compártelo como una tarjeta con quien quieras.',
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
    <div className="min-h-screen bg-glow-top flex flex-col px-4 pt-8 pb-10">
      <div className="text-center px-2">
        <div className="mx-auto w-16 h-16 rounded-[20px] bg-linear-to-br from-primary to-rose shadow-card flex items-center justify-center">
          <img src={logoIconDark} alt="Teleo" className="w-8 h-8" />
        </div>
        <h1 className="font-title text-[clamp(30px,8.5vw,40px)] leading-[1.05] text-text mt-5 text-balance">
          ¡Teleo te da la bienvenida!
        </h1>
        <p className="font-body text-body-md text-text-secondary mt-2">
          Un vistazo rápido antes de empezar a construir tu rincón de lectura.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3 mt-8 stagger-children">
        {steps.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-3.5 bg-surface border border-border rounded-card shadow-card p-4">
            <span className="w-10 h-10 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-body-lg text-text">{title}</h3>
              <p className="text-body-sm text-text-secondary mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 mt-8">
        <Button variant="primary" onClick={handleStart} isLoading={isSaving}>
          Empezar a leer
        </Button>
        <Button variant="outline" onClick={() => navigate('/tutorial')}>
          Ver el tutorial
        </Button>
      </div>
    </div>
  )
}
