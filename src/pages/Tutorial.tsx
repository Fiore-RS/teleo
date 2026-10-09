import { useLocation } from 'react-router-dom'
import { useFinishIntro } from '../hooks/useFinishIntro'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Card } from '../assets/components/molecules/Card'
import { SubpageNav } from '../assets/components/molecules/SubpageNav'
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
      'Marca tu sesión de lectura del día para mantener tu racha: la cinta de arriba a la derecha se llena. Tócala, o toca "Calendario", para ver tus días leídos, tu racha más larga y los números de cada mes.',
      'Mira cuánto falta para el próximo libro que esperas y toca la tarjeta para ir a Lanzamientos.',
      'Define una meta anual de libros y sigue tu progreso a lo largo del año.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Estante',
    points: [
      'Toca el botón + de abajo para agregar libros buscando por título, autor o ISBN, escaneando el código de barras, o creándolos desde cero si no aparecen en la búsqueda.',
      'Al terminar un libro, guarda su fecha de inicio y de fin, y escribe la reseña solo si quieres. Todo libro con fecha de fin cuenta para la meta de ese año.',
      'Agrupa libros en sagas, agrega varios a la vez y anota cuántos tendrá en total para ver tu progreso, por ejemplo "2 de 5".',
      'Usa la barra de arriba para buscar por título o autor, y su botón de filtros para ver solo los libros de un estado, idioma, categoría o formato. Al bajar, la barra y las pestañas se quedan fijas; toca Estante en la barra de abajo para volver arriba.',
      'Usa el botón de organizar de la barra para ordenar por título, autor o fecha, o elige "Libre" para reordenar tus repisas arrastrando tus libros o sagas.',
      '¿No sabes qué leer? Toca "¿Qué leo ahora?" y Teleo elegirá uno de tus pendientes.',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Cuaderno',
    points: [
      'Toca el botón + de abajo para escribir una reseña de cualquier libro terminado que todavía no tenga una, sin apuro: califica tu experiencia, agrega calificaciones personalizadas (por ejemplo, romance o giros de trama) y guarda tus citas favoritas.',
      'Consulta todas tus reseñas pasadas cuando quieras revivirlas, y en Citas encuentra todas tus citas guardadas, con una al azar arriba; agrega una nueva con el botón + de abajo.',
    ],
  },
  {
    icon: ScrollText,
    title: 'Bitácora',
    points: [
      'En Estadísticas: tu año en una tarjeta (usa las flechas para ver años anteriores) y, en "Más de tu bitácora", tu ritmo y tu racha, tu colección, tus autores y sagas, tus calificaciones y lo que leíste. Toca cada fila para abrirla.',
      'En Resumen: los libros que terminaste cada mes, tu año en un estante (toca un lomo para ver ese mes) y, en Favoritos, tu favorito de cada mes y del año.',
      'En Compras: cuánto has invertido en tu biblioteca por estado y la lista de tus libros agrupada por mes de compra. Filtra los que no tienen precio y tócalos para agregarlo.',
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
      'En Tu biblioteca, toca cualquier estado (leyendo, leídos, pendientes, deseados y abandonados) para verlos en tu Estante.',
      'Mira tu actividad del mes y organiza tu lista de temporada desde sus tres puntos: cámbiale el nombre o toca "Organizar", arrastra los libros y toca "Listo" al terminar. También puedes empezar a leer desde ahí.',
      'En Favoritos, Recomendados, Deseados y Abandonados verás cinco libros al azar en cada visita. Toca "Ver todos" para ir a tu Estante con ese filtro.',
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

/** Tutorial: se abre desde Configuración (con la barra de pestañas, Perfil marcado) o desde
 *  la bienvenida de una cuenta nueva, que pasa { from: 'bienvenida' }: ahí todavía no hay
 *  barra, así que termina con "Listo", que cierra la bienvenida y sigue a La mesa. */
export function Tutorial() {
  const location = useLocation()
  const { finishIntro, isSaving } = useFinishIntro()
  const fromWelcome = (location.state as { from?: string } | null)?.from === 'bienvenida'

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <PageHeader
        title="Tutorial de Teleo"
        subtitle="Un repaso punto por punto de todo lo que puedes hacer en cada sección de la app."
      />

      <div className="flex flex-col gap-4 stagger-children">
        {sections.map(({ icon: Icon, title, points }) => (
          <Card key={title} tab={{ label: title, icon: Icon }}>
            <ul className="space-y-2.5">
              {points.map((point) => (
                <li key={point} className="flex gap-2.5 text-body-md text-text-secondary">
                  <Sparkle size={9} className="text-ornament shrink-0 mt-1.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <SubpageNav
        tab="perfil"
        parentPath="/configuracion"
        onDone={fromWelcome ? finishIntro : undefined}
        isDoneLoading={isSaving}
      />
    </div>
  )
}
