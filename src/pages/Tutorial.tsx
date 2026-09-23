import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import {
  Coffee, BookOpen, NotebookPen, ScrollText, User, Settings,
  type LucideIcon,
} from 'lucide-react'

interface TutorialSection {
  icon: LucideIcon
  title: string
  points: string[]
}

const sections: TutorialSection[] = [
  {
    icon: Coffee,
    title: 'Mesa',
    points: [
      'Ve el libro que estás leyendo ahora, con su porcentaje de avance, y actualízalo cuando quieras.',
      'Marca tu sesión de lectura del día para mantener tu racha diaria.',
      'Define una meta anual de libros y sigue tu progreso a lo largo del año.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Estante',
    points: [
      'Toca el botón + del encabezado para agregar libros buscando por título, autor o ISBN, escaneando el código de barras, o creándolos desde cero si no aparecen en la búsqueda.',
      'Agrupa libros en sagas y anota cuántos libros tendrá en total para ver tu progreso, por ejemplo "2 de 5".',
      'Toca la lupa para buscar en tu estante por título o autor, y el botón de filtros para ver solo los libros de un estado, idioma, categoría o formato.',
      'Usa el botón de organizar para ordenar por título, autor o fecha, o elige "Libre" para reordenar tu estante arrastrando tus libros o sagas.',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Cuaderno',
    points: [
      'Toca el botón + para escribir una reseña de cada libro que termines: califica tu experiencia y guarda tus citas favoritas.',
      'Consulta todas tus reseñas pasadas cuando quieras revivirlas.',
    ],
  },
  {
    icon: ScrollText,
    title: 'Bitácora',
    points: [
      'Consulta tus estadísticas completas de lectura: páginas leídas, tiempo escuchado, libros terminados y mucho más, además de tu racha actual y tu racha más extensa con un calendario de tus días de lectura.',
      'Revisa el desglose de tu colección por categoría, formato e idioma, tus autores y series con más libros, y tus calificaciones más altas y más bajas.',
      'Repasa tu historial de lectura año por año y consulta el valor total de tu biblioteca, si registras el precio y la fecha de compra de tus libros.',
    ],
  },
  {
    icon: User,
    title: 'Perfil',
    points: [
      'Sigue tu meta anual de lectura y consulta lo que estás leyendo ahora, tus favoritos, recomendados y lista de deseados.',
      'Toca "Ver todos" en cualquier lista para saltar directo a tu Estante con ese filtro ya activado.',
      'Cambia tu foto tocando tu avatar y edita tu descripción desde "Sobre mí". El engranaje de arriba te lleva a Configuración.',
    ],
  },
  {
    icon: Settings,
    title: 'Configuración',
    points: [
      'Cambia el tema de la app, tu nombre de usuario, correo o contraseña.',
      'Comparte tu perfil como una imagen: tu meta anual, racha, calendario del mes, lo que estás leyendo y el último libro terminado, lista para enviar o descargar.',
      'Comparte tu lista de deseados completa como PDF, organizada por autor, para que sepan qué regalarte.',
      'Exporta o importa tus datos, o gestiona tu cuenta (pausarla o eliminarla) cuando lo necesites.',
    ],
  },
]

export function Tutorial() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader
        title="Tutorial de Teleo"
        subtitle="Un repaso punto por punto de todo lo que puedes hacer en cada sección de la app."
        onBack={() => navigate(-1)}
      />

      <div className="flex flex-col gap-4 stagger-children">
        {sections.map(({ icon: Icon, title, points }) => (
          <section key={title} className="bg-surface border border-border rounded-card shadow-card p-[18px]">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
                <Icon size={19} />
              </span>
              <h2 className="font-display font-semibold text-display-md text-text">{title}</h2>
            </div>
            <ul className="mt-3.5 space-y-2.5">
              {points.map((point) => (
                <li key={point} className="flex gap-2.5 text-body-md text-text-secondary">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
