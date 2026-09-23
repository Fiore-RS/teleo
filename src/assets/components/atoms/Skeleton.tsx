interface SkeletonProps {
  className?: string
}

/** Silueta gris suave que ocupa el lugar de un dato mientras se carga por primera vez
 *  (rediseño 2026). Con la caché de datos solo se ve en la primera visita a cada pantalla. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`bg-surface-2 border border-border/60 rounded-lg animate-skeleton ${className}`} />
}

/** Silueta de portada (proporción 2:3), con la misma esquina y tamaño que las portadas reales. */
export function CoverSkeleton({ className = '' }: SkeletonProps) {
  return <Skeleton className={`aspect-2/3 rounded-[10px] ${className}`} />
}

/** Portada + dos líneas de texto, como una celda de la cuadrícula de El estante / El cuaderno. */
export function BookTileSkeleton() {
  return (
    <div aria-hidden="true">
      <CoverSkeleton className="w-full" />
      <Skeleton className="h-3.5 w-11/12 mt-2.5 rounded-full" />
      <Skeleton className="h-3 w-2/3 mt-1.5 rounded-full" />
    </div>
  )
}

/** Recuadro de dato (StatTile) de Bitácora. */
export function StatTileSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={`bg-surface-2 border border-border rounded-2xl px-3.5 py-3 ${className}`}>
      <Skeleton className="h-5 w-1/2 rounded-full bg-surface" />
      <Skeleton className="h-3 w-3/4 mt-2.5 rounded-full bg-surface" />
    </div>
  )
}

/** Detalle de libro / saga / reseña: portada a la izquierda con título y autor, y debajo
 *  unas filas de datos. Mismo esquema que el diseño real, para que no "salte" al cargar. */
export function DetailSkeleton() {
  return (
    <div aria-label="Cargando">
      <div className="flex gap-4 items-start">
        <CoverSkeleton className="w-28 shrink-0" />
        <div className="flex-1 pt-1">
          <Skeleton className="h-5 w-11/12 rounded-full" />
          <Skeleton className="h-5 w-2/3 mt-2 rounded-full" />
          <Skeleton className="h-3.5 w-1/2 mt-3 rounded-full" />
          <Skeleton className="h-7 w-24 mt-4 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-36 w-full mt-6 rounded-2xl" />
      <Skeleton className="h-11 w-full mt-6 rounded-full" />
    </div>
  )
}
