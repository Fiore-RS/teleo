import { PageHeader } from '../assets/components/molecules/PageHeader'
import { Card } from '../assets/components/molecules/Card'
import { SubpageNav } from '../assets/components/molecules/SubpageNav'
import { Sparkle } from '../assets/components/atoms/Sparkle'

interface TutorialSection {
  title: string
  points: string[]
}

const sections: TutorialSection[] = [
  {
    title: 'Mesa',
    points: [
      'Ve los libros que estás leyendo, con su avance, y actualízalos cuando quieras. Si no estás leyendo nada, Teleo puede elegir al azar uno de tus pendientes.',
      'Marca tu sesión de lectura del día para mantener tu racha: la cinta de arriba a la derecha se llena. Tócala, o toca "Calendario", para ver tus días leídos, tu racha más larga y los números de cada mes.',
      'Mira la fecha del próximo libro que esperas y cuánto falta, y toca la tarjeta para ir a Lanzamientos.',
      'Define una meta anual de libros y sigue tu progreso a lo largo del año. Para cambiarla, toca "Editar" arriba de su tarjeta, aquí o en Perfil.',
    ],
  },
  {
    title: 'Estante',
    points: [
      'Toca el botón + de abajo para agregar libros buscando por título, autor o ISBN, escaneando el código de barras, o creándolos desde cero si no aparecen en la búsqueda.',
      '¿Ya usas Goodreads? Trae tu biblioteca desde Configuración › Importar desde Goodreads (o desde el atajo del Estante vacío). Las estanterías que coinciden con un género quedan como género, y las demás como etiquetas.',
      'Al terminar un libro, guarda su fecha de inicio y de fin, y escribe la reseña solo si quieres. Todo libro con fecha de fin cuenta para la meta de ese año.',
      'Agrupa libros en sagas, agrega varios a la vez y anota cuántos tendrá en total para ver tu progreso, por ejemplo "2 de 5". Al terminar un libro de una saga, Teleo te propone el siguiente. Ponle género y ánimo a la saga y llegan a todos sus libros; cada libro se puede cambiar en Editar libro.',
      'Cuenta cómo es cada libro: hasta 3 géneros, hasta 3 ánimos (también los tuyos) y su ritmo, desde Editar libro o al terminarlo. En Configuración, "Completar géneros" los sugiere para tu biblioteca (uno por saga) y "Completa tu estante" te pasa tus libros leídos uno por uno.',
      'Si dejas un libro por un tiempo, ponlo En pausa: tu progreso se guarda y lo retomas desde sus detalles.',
      'Usa la barra de arriba para buscar por título o autor, y su botón de filtros para ver solo los libros de un estado, idioma, categoría, formato, género, ánimo, ritmo o etiqueta. En Sagas puedes filtrar por estado, categoría, género y ánimo. Al bajar, la barra y las pestañas se quedan fijas; toca Estante en la barra de abajo para volver arriba.',
      'Toca el botón de vista de la barra para elegir cómo se ve tu estante: 3 o 4 libros por fila, con o sin título y autor, y con o sin repisa. Se guarda en tu cuenta.',
      'Usa el botón de organizar de la barra para ordenar por título, autor o fecha, o elige "Libre" para reordenar tus repisas arrastrando tus libros o sagas.',
      '¿No sabes qué leer? Toca "¿Qué leo ahora?" y Teleo elegirá uno de tus pendientes; puedes pedirle uno de cierto género, ánimo o ritmo.',
    ],
  },
  {
    title: 'Cuaderno',
    points: [
      'Toca el botón + de abajo para escribir una reseña de cualquier libro terminado que todavía no tenga una, sin apuro: califica tu experiencia, agrega calificaciones personalizadas (por ejemplo, romance o giros de trama) y guarda tus citas favoritas.',
      'Consulta todas tus reseñas pasadas cuando quieras revivirlas, y en Citas encuentra todas tus citas guardadas, con una al azar arriba; agrega una nueva con el botón + de abajo.',
      'Ordena tus reseñas y tus citas por título, autor o fecha con el botón de organizar, o elige "Libre" para acomodarlas arrastrándolas.',
    ],
  },
  {
    title: 'Bitácora',
    points: [
      'En Estadísticas: tu año en una tarjeta (usa las flechas para ver años anteriores) y, en "Más de tu bitácora", tu ritmo y tu racha, tu colección, tus autores y sagas, tus calificaciones, lo que leíste y tus géneros y ánimos. Toca cada fila para abrirla.',
      'En Resumen: los libros que terminaste cada mes, tu año en un estante (toca un lomo para ver ese mes) y, en Favoritos, tu favorito de cada mes y del año.',
      'Comparte tu lectura: en Resumen › Mes toca "Compartir mi mes", y en Resumen › Año, "Compartir mi año". Pasa las tarjetas con un toque y comparte una o todas.',
      'En Compras: cuánto has invertido en tu biblioteca por estado y la lista de tus libros agrupada por mes de compra. Filtra los que no tienen precio y tócalos para agregarlo.',
    ],
  },
  {
    title: 'Lanzamientos',
    points: [
      'Anota los libros que estás esperando con su fecha, dónde saldrán y su precio.',
      'Míralos en un calendario por mes o en una cuenta atrás ordenada por fecha.',
      'Enlázalos con un libro de tu lista de deseados para verlos también en su detalle.',
    ],
  },
  {
    title: 'Perfil',
    points: [
      'Toca el lápiz de arriba para cambiar tu foto, tu nickname y tu descripción.',
      'En Tu biblioteca ves cuántos libros tienes, cuántos leíste este año y tu racha. Toca cualquier estado (leyendo, en pausa, leídos, pendientes, deseados y abandonados) para verlos en tu Estante.',
      'En Ahora mismo ves lo que estás leyendo, el último libro que terminaste y una de tus citas, distinta en cada visita. Organiza Mis próximas lecturas desde sus tres puntos: agrega o quita pendientes con "Agregar libros", cámbiale el nombre o toca "Organizar", arrastra los libros y toca "Listo" al terminar. También puedes empezar a leer desde ahí.',
      'En Estanterías elige Favoritos, Recomendados, Deseados o Abandonados para ver hasta diez libros al azar en cada visita. Toca "Ver todos" para ir a tu Estante con ese filtro.',
      'El botón de compartir muestra tu código de Teleo (tócalo para copiarlo) y te deja invitar a alguien con un enlace o una tarjeta con código QR, enviar tu perfil como una tarjeta para historias o tu lista de deseados como PDF.',
    ],
  },
  {
    title: 'Configuración',
    points: [
      'Revisa las Novedades de cada versión, conoce la historia detrás de Teleo y repite el Tutorial, el recorrido corto por la app, cuando quieras.',
      'Elige el modo de color, la moneda de tu biblioteca, y cambia tu usuario, nickname, correo o contraseña.',
      'Invita a alguien a Teleo, copia tu código, comparte tu tarjeta de perfil o tu lista de deseados, y consulta la política de privacidad y los términos de uso.',
      'Exporta o importa tus datos, trae tu biblioteca de Goodreads, completa los géneros de tu biblioteca, o gestiona tu cuenta (pausarla o eliminarla) cuando lo necesites.',
    ],
  },
]

/** Guía de Teleo (antes "Tutorial"; V.3.3.0): desde que existe el recorrido sobre la app, que
 *  ahora es el Tutorial, esta pantalla queda como explicación detallada de cada sección. Se
 *  abre solo desde Configuración, con la barra de pestañas y Perfil marcado. */
export function Tutorial() {
  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <PageHeader
        title="Guía de Teleo"
        subtitle="Todo lo que puedes hacer en cada sección de la app, punto por punto."
      />

      <div className="flex flex-col gap-4">
        {sections.map(({ title, points }) => (
          <Card key={title} tab={{ label: title }}>
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

      <SubpageNav tab="perfil" parentPath="/configuracion" />
    </div>
  )
}
