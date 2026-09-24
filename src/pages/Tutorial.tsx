import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import {
  Coffee, BookOpen, NotebookPen, ScrollText, User, Settings, CalendarClock,
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
      'Ve los libros que estás leyendo, con su avance, y actualízalos cuando quieras. Si no estás leyendo nada, Teleo puede elegir al azar uno de tus pendientes.',
      'Marca tu sesión de lectura del día para mantener tu racha. Toca la llama de arriba o "Calendario" para ver tus días leídos, tu racha más larga y los números de cada mes.',
      'Mira cuánto falta para el próximo libro que esperas y toca la tarjeta para ir a Lanzamientos.',
      'Define una meta anual de libros y sigue tu progreso a lo largo del año.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Estante',
    points: [
      'Toca el botón + del encabezado para agregar libros buscando por título, autor o ISBN, escaneando el código de barras, o creándolos desde cero si no aparecen en la búsqueda.',
      'Al terminar un libro, guarda su fecha de inicio y de fin, y escribe la reseña solo si quieres. Todo libro con fecha de fin cuenta para la meta de ese año.',
      'Agrupa libros en sagas, agrega varios a la vez y anota cuántos tendrá en total para ver tu progreso, por ejemplo "2 de 5".',
      'Toca la lupa para buscar por título o autor, y el botón de filtros para ver solo los libros de un estado, idioma, categoría o formato.',
      'Usa el botón de organizar para ordenar por título, autor o fecha, o elige "Libre" para reordenar tu estante arrastrando tus libros o sagas.',
      '¿No sabes qué leer? Toca "¿Qué leo ahora?" y Teleo elegirá uno de tus pendientes.',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Cuaderno',
    points: [
      'Toca el botón + para escribir una reseña de cualquier libro terminado que todavía no tenga una, sin apuro: califica tu experiencia, agrega calificaciones personalizadas (por ejemplo, romance o giros de trama) y guarda tus citas favoritas.',
      'Consulta todas tus reseñas pasadas cuando quieras revivirlas.',
    ],
  },
  {
    icon: ScrollText,
    title: 'Bitácora',
    points: [
      'En Estadísticas: páginas leídas, tiempo escuchado, libros terminados, tu racha con su calendario, el desglose de tu colección, tus autores y tus calificaciones.',
      'En Resumen: los libros que terminaste cada mes y cada año, y tu favorito de cada mes. Al final del año, elige entre ellos tu favorito del año.',
      'En Compras: cuánto has invertido en tu biblioteca y la lista de tus libros con su precio. Filtra los que no tienen precio y tócalos para agregarlo.',
    ],
  },
  {
    icon: CalendarClock,
    title: 'Lanzamientos',
    points: [
      'Anota los libros que estás esperando con su fecha, dónde saldrán y su precio.',
      'Míralos en un calendario por mes o en una cuenta atrás ordenada por fecha.',
      'Enlázalos con un libro de tu lista de deseados para verlos también en su detalle.',
    ],
  },
  {
    icon: User,
    title: 'Perfil',
    points: [
      'Toca el lápiz de arriba para cambiar tu foto, tu nickname y tu descripción.',
      'Toca cualquiera de tus números (leídos, pendientes, deseados y abandonados) para verlos en tu Estante.',
      'Mira tu actividad del mes y organiza tu lista de temporada desde sus tres puntos: cámbiale el nombre o toca "Organizar", arrastra los libros y toca "Listo" al terminar. También puedes empezar a leer desde ahí.',
      'En Favoritos, Recomendados, Deseados y Abandonados verás cuatro libros al azar en cada visita. Toca "Ver todos" para ir a tu Estante con ese filtro.',
      'El botón de compartir te deja enviar tu perfil como una tarjeta para historias o tu lista de deseados como PDF.',
    ],
  },
  {
    icon: Settings,
    title: 'Configuración',
    points: [
      'Revisa las Novedades de cada versión y conoce la historia detrás de Teleo.',
      'Elige el modo de color, la moneda de tu biblioteca, y cambia tu usuario, nickname, correo o contraseña.',
      'Comparte tu tarjeta de perfil o tu lista de deseados, y consulta la política de privacidad y los términos de uso.',
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
