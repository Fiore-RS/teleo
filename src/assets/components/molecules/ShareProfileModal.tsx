import { useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Download } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { SegmentedTabs } from '../atoms/SegmentedTabs'
import { Button } from '../atoms/Button'
import { ShareProfileCard, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './ShareProfileCard'
import { ShareBookPickerSheet } from './ShareBookPickerSheet'
import { useAnnualGoal } from '../../../hooks/useAnnualGoal'
import { useReadingStreak } from '../../../hooks/useReadingStreak'
import { useProfile } from '../../../hooks/useProfile'
import { useShareCardExtras } from '../../../hooks/useShareCardExtras'
import { getProgressInfo } from '../../../lib/progress'
import { useTheme } from '../../../hooks/useTheme'

// La vista previa se muestra al 80% para que entre en la hoja junto con los botones.
const PREVIEW_SCALE = 0.8

// Mismos valores que --teleo-text en index.css, para que el QR siempre contraste con
// el fondo (bg-bg) del tema activo — igual criterio que ShareModal.
const QR_COLOR_LIGHT = '#2B211B'
const QR_COLOR_DARK = '#F3E9DA'

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
 *  compartirla como imagen (Web Share API, con descarga como respaldo) o mostrar un QR que
 *  lleva al sitio de Teleo. "Actual" arranca con el libro que empezaste más recientemente y
 *  "Próxima" con el primero de la lista de temporada (o el último pendiente que agregaste);
 *  tocando cualquiera de los dos en la vista previa se elige otro o se deja vacío. La
 *  elección vale solo para esta tarjeta.
 *
 *  Solo se monta mientras el modal está abierto, así que los datos se piden al abrirlo. */
export function ShareProfileModal({ onClose, userId }: ShareProfileModalProps) {
  const [mode, setMode] = useState<'tarjeta' | 'qr'>('tarjeta')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  // undefined = elección automática; null = "No mostrar"; string = libro elegido.
  const [currentChoice, setCurrentChoice] = useState<string | null | undefined>(undefined)
  const [nextChoice, setNextChoice] = useState<string | null | undefined>(undefined)
  const [picking, setPicking] = useState<'actual' | 'proxima' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

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

  const appUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
  const qrColor = resolvedTheme === 'dark' ? QR_COLOR_DARK : QR_COLOR_LIGHT

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
      return await toBlob(cardRef.current, {
        pixelRatio: 3,
        imagePlaceholder: TRANSPARENT_PIXEL,
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
    setIsGenerating(true)
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
          text: `El perfil de lectura de @${username} en Teleo`,
        })
      } else {
        downloadBlob(blob)
      }
    } catch (err) {
      // AbortError = el usuario canceló el share nativo — no es un error real.
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[ShareProfileModal] Error al compartir:', err)
      setError('No se pudo compartir la imagen. Intenta de nuevo o usa "Descargar imagen".')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    setIsGenerating(true)
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
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Modal variant="sheet" isOpen onClose={onClose} title="Compartir mi perfil">
        <SegmentedTabs
          active={mode}
          onChange={setMode}
          options={[
            { value: 'tarjeta', label: 'Tarjeta' },
            { value: 'qr', label: 'Código QR' },
          ]}
        />

        {mode === 'tarjeta' ? (
          <>
            {/* Vista previa achicada; la captura usa la tarjeta a su tamaño real. */}
            <div className="mt-4 mx-auto" style={{ width: SHARE_CARD_WIDTH * PREVIEW_SCALE, height: SHARE_CARD_HEIGHT * PREVIEW_SCALE }}>
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
                />
              </div>
            </div>
            <p className="text-body-sm text-text-secondary text-center mt-3">
              Toca Actual o Próxima para elegir otro libro.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={handleShare} isLoading={isGenerating}>
                <Share2 size={18} /> Compartir
              </Button>
              <Button variant="outline" onClick={handleDownload} isLoading={isGenerating}>
                <Download size={18} /> Descargar imagen
              </Button>
              {error && <p className="text-body-sm text-primary-text text-center mt-1">{error}</p>}
              {downloaded && !error && (
                <p className="text-body-sm text-text-secondary text-center mt-1">
                  Imagen descargada. Revisa tu carpeta de descargas.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-surface-2 border border-border rounded-2xl p-6 mt-4 flex flex-col items-center">
            <QRCodeSVG value={appUrl} size={160} fgColor={qrColor} bgColor="transparent" />
            <p className="text-body-sm text-text-secondary mt-3 text-center">Escanea para descubrir Teleo.</p>
          </div>
        )}
      </Modal>

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
