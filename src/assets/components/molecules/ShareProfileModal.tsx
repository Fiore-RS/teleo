import { useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, Download } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { SegmentedTabs } from '../atoms/SegmentedTabs'
import { Button } from '../atoms/Button'
import { ShareProfileCard } from './ShareProfileCard'
import { useAnnualGoal } from '../../../hooks/useAnnualGoal'
import { useReadingStreak } from '../../../hooks/useReadingStreak'
import { useProfileLists } from '../../../hooks/useProfileLists'
import { useShareCardExtras } from '../../../hooks/useShareCardExtras'
import { useTheme } from '../../../hooks/useTheme'
import type { Database } from '../../../types/database'

type Book = Database['public']['Tables']['books']['Row']

// Mismos valores que --teleo-text en index.css, para que el QR siempre contraste con
// el fondo (bg-bg) del tema activo — igual criterio que ShareModal.
const QR_COLOR_LIGHT = '#2B211B'
const QR_COLOR_DARK = '#F3E9DA'

// La tarjeta ya no muestra portadas de libros (se quitaron por el problema de CORS de
// Google Books, ver memoria del proyecto), así que la única imagen externa que queda es
// la foto de perfil. Si esa imagen fallara al incrustarse (CORS, URL caída, etc.),
// html-to-image cae a `imagePlaceholder` en vez de a `src=""` (que sí dispara un error
// real y aborta toda la captura) — con este PNG transparente de 1x1, el avatar
// simplemente queda en blanco en vez de romper la tarjeta entera.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function pickRandom(books: Book[], count: number): Book[] {
  return [...books].sort(() => Math.random() - 0.5).slice(0, count)
}

interface ShareProfileModalProps {
  onClose: () => void
  userId: string | undefined
  username: string | undefined
  bio: string | null | undefined
  avatarUrl: string | null | undefined
}

/** Modal de "Compartir mi perfil": arma la tarjeta con los datos del usuario y permite
 *  compartirla como imagen (Web Share API, con descarga como respaldo) o, alternativamente,
 *  mostrar un QR que lleva al sitio de Teleo (no a un perfil específico — no existe una
 *  página pública en vivo, ver plan en memoria del proyecto).
 *
 *  Solo se monta mientras el modal está abierto (ver Configuracion.tsx), así que los hooks
 *  de datos de acá adentro no corren en cada visita a Configuración, solo cuando de verdad
 *  se abre "Compartir perfil". */
export function ShareProfileModal({ onClose, userId, username, bio, avatarUrl }: ShareProfileModalProps) {
  const [mode, setMode] = useState<'tarjeta' | 'qr'>('tarjeta')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  const { goal: annualGoal, completedCount: annualCompletedCount } = useAnnualGoal(userId)
  const { streak } = useReadingStreak(userId)
  const { currentlyReading, recommended, wishlist } = useProfileLists(userId)
  const { recentFinishedBook, recentFinishedRating, sessionDates } = useShareCardExtras(userId)

  // Se resortean cada vez que se abre el modal (no en cada render): la dependencia son
  // los arreglos que trae useProfileLists, que solo cambian cuando termina su fetch.
  // Por ahora se muestra solo 1 libro al azar de cada lista (antes eran 3) — decisión de
  // Fiorella del 2026-09-01, para no saturar la tarjeta ahora que cada libro es una fila
  // de texto en vez de una portada chica.
  const randomRecommended = useMemo(() => pickRandom(recommended, 1), [recommended])
  const randomWishlist = useMemo(() => pickRandom(wishlist, 1), [wishlist])

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
    // pixelRatio alto porque el nodo se renderiza chico en pantalla (cabe en el modal),
    // pero la imagen final debe verse nítida al compartirla o ampliarla.
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
    <Modal isOpen onClose={onClose} title="Compartir mi perfil">
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
          <div className="mt-4">
            <ShareProfileCard
              ref={cardRef}
              username={username}
              bio={bio}
              avatarUrl={avatarUrl}
              annualGoal={annualGoal}
              annualCompletedCount={annualCompletedCount}
              streak={streak}
              sessionDates={sessionDates}
              currentlyReading={currentlyReading}
              recentFinishedBook={recentFinishedBook}
              recentFinishedRating={recentFinishedRating}
              recommended={randomRecommended}
              wishlist={randomWishlist}
            />
          </div>
          <div className="flex flex-col gap-2 mt-5">
            <Button variant="primary" onClick={handleShare} isLoading={isGenerating}>
              <Share2 size={18} /> Compartir
            </Button>
            <Button variant="outline" onClick={handleDownload} isLoading={isGenerating}>
              <Download size={18} /> Descargar imagen
            </Button>
            {error && <p className="text-body-sm text-accent-wishlist text-center mt-1">{error}</p>}
            {downloaded && !error && (
              <p className="text-body-sm text-text-secondary text-center mt-1">
                Imagen descargada — revisa tu carpeta de descargas.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-bg rounded-2xl p-6 mt-4 flex flex-col items-center">
          <QRCodeSVG value={appUrl} size={160} fgColor={qrColor} bgColor="transparent" />
          <p className="text-body-sm text-text-secondary mt-3 text-center">Escanea para descubrir Teleo.</p>
        </div>
      )}
    </Modal>
  )
}
