import { useNavigate } from 'react-router-dom'
import {
  Coffee, BookOpen, NotebookPen, ScrollText, User, Settings,
  ChevronLeft, type LucideIcon,
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
      'Agrega libros buscando por título, autor o ISBN, escaneando el código de barras, o creándolos desde cero si no aparecen en la búsqueda.',
      'Agrupa libros en sagas y anota cuántos libros tendrá en total para ver tu progreso, por ejemplo "2 de 5".',
      'Usa los filtros rápidos de estado o el botón "Filtros" para buscar por estado, idioma, categoría o formato.',
      'Activa "Organizar" para reordenar tu librería arrastrando tus libros o sagas.',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Cuaderno',
    points: [
      'Escribe una reseña para cada libro que termines: califica tu experiencia y guarda tus citas favoritas.',
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
      'Comparte tu perfil como una tarjeta con tu meta, racha y lecturas actuales, desde Configuración.',
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
    <div className="min-h-screen bg-bg p-6 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-body-md font-medium text-accent-wishlist mb-4 -ml-1"
      >
        <ChevronLeft size={20} strokeWidth={2} />
        Regresar
      </button>

      <h1 className="font-display italic text-display-lg text-accent-wishlist">
        Tutorial para navegar por Teleo
      </h1>
      <div className="h-1.5 rounded-full bg-border mt-3" />
      <p className="text-body-md text-text-secondary mt-3">
        Un repaso punto por punto de todo lo que puedes hacer en cada sección de la app.
      </p>

      <div className="space-y-6 mt-6">
        {sections.map(({ icon: Icon, title, points }) => (
          <div key={title} className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-full bg-accent-wishlist flex items-center justify-center">
                <Icon size={20} className="text-surface" />
              </div>
              <h2 className="font-display italic text-display-md text-accent-wishlist">{title}</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {points.map((point) => (
                <li key={point} className="flex gap-2 text-body-sm text-text-secondary">
                  <span className="text-accent-wishlist shrink-0">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
