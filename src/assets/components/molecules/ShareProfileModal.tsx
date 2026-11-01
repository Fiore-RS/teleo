import { useRef, useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { ShareActions } from './ShareActions'
import { ShareProfileCard, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './ShareProfileCard'
import { ShareBookPickerSheet } from './ShareBookPickerSheet'
import { useAnnualGoal } from '../../../hooks/useAnnualGoal'
import { useReadingStreak } from '../../../hooks/useReadingStreak'
import { useProfile } from '../../../hooks/useProfile'
import { useShareCardExtras } from '../../../hooks/useShareCardExtras'
import { getProgressInfo } from '../../../lib/progress'
import { isBannerId } from '../../../lib/banners'

const DOWNLOADED_TEXT = 'Imagen descargada. Revisa tu carpeta de descargas.'

// La vista previa se muestra al 80% para que entre en la hoja junto con los botones.
const PREVIEW_SCALE = 0.8

// Las portadas y la foto pasan por shareSafeImageUrl (lib/shareImage.ts) para poder
// incrustarlas. Si igual alguna falla al capturar, html-to-image usa este PNG transparente
// de 1x1 en su lugar en vez de abortar toda la tarjeta.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

interface ShareProfileModalProps {
  onClose: () => void
  userId: string | undefined
}

/** Modal de "Compartir mi perfil": arma la tarjeta en formato historia (fase 8) y permite
 *  compartirla como imagen (Web Share API, con descarga como respaldo). El código QR que
 *  había antes se quitó en la V.2.1.0: Teleo no es una red social y la tarjeta ya cumple esa
 *  función. "Actual" arranca con el libro que empezaste más recientemente y
 *  "Próxima" con el primero de la lista de temporada (o el último pendiente que agregaste);
 *  tocando cualquiera de los dos en la vista previa se elige otro o se deja vacío. La
 *  elección vale solo para esta tarjeta.
 *
 *  Solo se monta mientras el modal está abierto, así que los datos se piden al abrirlo. */
export function ShareProfileModal({ onClose, userId }: ShareProfileModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  // undefined = elección automática; null = "No mostrar"; string = libro elegido.
  const [currentChoice, setCurrentChoice] = useState<string | null | undefined>(undefined)
  const [nextChoice, setNextChoice] = useState<string | null | undefined>(undefined)
  const [picking, setPicking] = useState<'actual' | 'proxima' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const { profile } = useProfile(userId)
  const { goal: annualGoal, completedCount: annualCompletedCount } = useAnnualGoal(userId)
  const { streak, longestStreak } = useReadingStreak(userId)
  const { lastFinished, lastFinishedRating, reading, seasonList, pending } = useShareCardExtras(userId)
  const nextOptions = seasonList.length > 0 ? seasonList : pending
  const currentBook =
    currentChoice === undefined ? reading[0] ?? null : currentChoice === null ? null : reading.find((b) => b.id === currentChoice) ?? null
  const nextBook =
    nextChoice === undefined ? nextOptions[0] ?? null : nextChoice === null ? null : pending.find((b) => b.id === nextChoice) ?? null
  const username = profile?.username

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teleo-perfil.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generateBlob() {
    if (!cardRef.current) return null
    // La tarjeta mide 360 × 640; a 3x queda en 1080 × 1920, el tamaño de una historia.
    try {
      // Se carga recién al crear la imagen, no al abrir la app.
      const { toBlob } = await import('html-to-image')
      return await toBlob(cardRef.current, {
        pixelRatio: 3,
        imagePlaceholder: TRANSPARENT_PIXEL,
        // Las portadas pasan por images.weserv.nl/?url=…: sin esto, html-to-image las guarda en
        // memoria por la dirección sin lo que va después del "?" y repite la misma portada (3.4.1).
        includeQueryParams: true,
        // Defensa extra: si por lo que sea una imagen (incluyendo el propio placeholder)
        // dispara `onerror` durante el renderizado, no tronamos toda la captura — la
        // dejamos en blanco y seguimos. Sin esto, un solo error de imagen aborta la tarjeta.
        onImageErrorHandler: (event) => {
          console.warn('[ShareProfileModal] Imagen no se pudo incrustar, se omite:', event)
        },
      })
    } catch (err) {
      console.error('[ShareProfileModal] toBlob lanzó un error:', err)
      throw err
    }
  }

  async function handleShare() {
    setError(null)
    try {
      const blob = await generateBlob()
      if (!blob) {
        setError('No se pudo generar la imagen. Intenta de nuevo.')
        return
      }
      const file = new File([blob], 'teleo-perfil.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi perfil en Teleo',
          text: 'Mi rincón lector: lo que leo, lo que me encantó y lo que sigue en la lista. Hecho con Teleo.',
        })
      } else {
        downloadBlob(blob)
      }
    } catch (err) {
      // AbortError = el usuario canceló el share nativo — no es un error real.
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[ShareProfileModal] Error al compartir:', err)
      setError('No se pudo compartir la imagen. Intenta de nuevo o usa "Descargar imagen".')
    }
  }

  async function handleDownload() {
    setError(null)
    setDownloaded(false)
    try {
      const blob = await generateBlob()
      if (blob) {
        downloadBlob(blob)
        setDownloaded(true)
      } else {
        setError('No se pudo generar la imagen. Intenta de nuevo.')
      }
    } catch (err) {
      console.error('[ShareProfileModal] Error al descargar:', err)
      setError('No se pudo generar la imagen. Intenta de nuevo.')
    }
  }

  return (
    <>
      <Sheet onClose={onClose} title="Compartir mi perfil" footer={
          <ShareActions
            shareLabel="Compartir imagen"
            onShare={handleShare}
            onDownload={handleDownload}
            disabled={false}
            notice={error ? { text: error, tone: 'error' as const } : downloaded ? { text: DOWNLOADED_TEXT, tone: 'ok' as const } : null}
          />
        }>
        <>
            {/* Vista previa achicada; la captura usa la tarjeta a su tamaño real. */}
            <div className="mx-auto" style={{ width: SHARE_CARD_WIDTH * PREVIEW_SCALE, height: SHARE_CARD_HEIGHT * PREVIEW_SCALE }}>
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }} className="shadow-float rounded-[22px]">
                <ShareProfileCard
                  ref={cardRef}
                  username={username}
                  nickname={profile?.nickname}
                  avatarUrl={profile?.avatar_url}
                  annualGoal={annualGoal}
                  annualCompletedCount={annualCompletedCount}
                  streak={streak}
                  longestStreak={longestStreak}
                  lastFinished={lastFinished}
                  lastFinishedRating={lastFinishedRating}
                  currentBook={currentBook}
                  currentPercent={currentBook ? getProgressInfo(currentBook).percent : 0}
                  nextBook={nextBook}
                  onPickCurrent={() => setPicking('actual')}
                  onPickNext={() => setPicking('proxima')}
                  banner={isBannerId(profile?.banner) ? profile.banner : undefined}
                />
              </div>
            </div>
            <p className="text-body-sm text-text-secondary text-center mt-3">
              Toca Actual o Próxima para elegir otro libro.
            </p>
        </>
      </Sheet>

      {picking === 'actual' && (
        <ShareBookPickerSheet
          title="Leyendo ahora"
          books={reading}
          selectedId={currentBook?.id ?? null}
          emptyText="No tienes libros en Leyendo."
          onSelect={(id) => {
            setCurrentChoice(id)
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}
      {picking === 'proxima' && (
        <ShareBookPickerSheet
          title="Próxima lectura"
          books={nextOptions}
          searchPool={pending}
          selectedId={nextBook?.id ?? null}
          emptyText="No tienes libros pendientes."
          onSelect={(id) => {
            setNextChoice(id)
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  )
}
