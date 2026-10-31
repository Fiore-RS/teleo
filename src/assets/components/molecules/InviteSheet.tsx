import { useRef, useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { FormHint, type FormHintTone } from './FormLayout'
import { InviteCard, INVITE_CARD_HEIGHT, INVITE_CARD_WIDTH } from './InviteCard'
import { useProfile } from '../../../hooks/useProfile'
import { isBannerId } from '../../../lib/banners'
import { buildInviteLink } from '../../../lib/friendCode'

// Vista previa achicada para que la hoja entre en la pantalla junto con el mensaje y los botones.
const PREVIEW_SCALE = 0.56

// Si una imagen no se puede incrustar al capturar, html-to-image usa este PNG transparente.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

const FILE_NAME = 'teleo-invitacion.png'

interface InviteSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** "Invita a alguien a Teleo" (V.3.3.0, vista previa B). "Enviar invitación" abre el menú de
 *  compartir del teléfono con el mensaje y el enlace (o lo copia si no hay menú). "Enviar
 *  imagen" comparte la tarjeta con QR, para historias, y "Descargar" la guarda. */
export function InviteSheet({ userId, onClose }: InviteSheetProps) {
  const { profile } = useProfile(userId)
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'link' | 'image' | 'download' | null>(null)
  const [notice, setNotice] = useState<{ text: string; tone: FormHintTone } | null>(null)

  const friendCode = profile?.friend_code
  const username = profile?.username ?? ''
  const displayName = profile?.nickname?.trim() || username
  const link = friendCode ? buildInviteLink(friendCode) : ''
  const message = `${displayName} te invita a Teleo, su diario de lectura.`

  async function generateFile(): Promise<File | null> {
    if (!cardRef.current) return null
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(cardRef.current, {
      pixelRatio: 3,
      imagePlaceholder: TRANSPARENT_PIXEL,
      onImageErrorHandler: (event) => console.warn('[InviteSheet] Imagen no se pudo incrustar, se omite:', event),
    })
    return blob ? new File([blob], FILE_NAME, { type: 'image/png' }) : null
  }

  function download(file: File) {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = FILE_NAME
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSendLink() {
    if (!link) return
    setBusy('link')
    setNotice(null)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Teleo', text: message, url: link })
      } else {
        await navigator.clipboard.writeText(`${message} ${link}`)
        setNotice({ text: 'Mensaje copiado. Pégalo donde quieras enviarlo.', tone: 'ok' })
      }
    } catch (err) {
      // AbortError = se cerró el menú de compartir sin elegir nada: no es un error.
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setNotice({ text: 'No se pudo compartir el enlace. Inténtalo de nuevo.', tone: 'error' })
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleSendImage() {
    setBusy('image')
    setNotice(null)
    try {
      const file = await generateFile()
      if (!file) throw new Error('Sin imagen')
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Teleo', text: `${message} ${link}` })
      } else {
        download(file)
        setNotice({ text: 'Tu navegador no deja compartir imágenes, así que la descargamos.', tone: 'muted' })
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        console.error('[InviteSheet] Error al compartir la imagen:', err)
        setNotice({ text: 'No se pudo compartir la imagen. Prueba con "Descargar".', tone: 'error' })
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleDownload() {
    setBusy('download')
    setNotice(null)
    try {
      const file = await generateFile()
      if (!file) throw new Error('Sin imagen')
      download(file)
      setNotice({ text: 'Imagen descargada. Revisa tu carpeta de descargas.', tone: 'ok' })
    } catch (err) {
      console.error('[InviteSheet] Error al descargar:', err)
      setNotice({ text: 'No se pudo generar la imagen. Inténtalo de nuevo.', tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet
      title="Invita a alguien a Teleo"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 pb-1">
          <Button variant="primary" onClick={handleSendLink} isLoading={busy === 'link'} disabled={!link || busy !== null}>
            Enviar invitación
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="py-2.5! text-body-md!" onClick={handleSendImage} isLoading={busy === 'image'} disabled={!friendCode || busy !== null}>
              Enviar imagen
            </Button>
            <Button variant="outline" size="sm" className="py-2.5! text-body-md!" onClick={handleDownload} isLoading={busy === 'download'} disabled={!friendCode || busy !== null}>
              Descargar
            </Button>
          </div>
        </div>
      }
    >
      {friendCode ? (
        <>
          {/* Vista previa achicada; la captura usa la tarjeta a su tamaño real. */}
          <div className="mx-auto" style={{ width: INVITE_CARD_WIDTH * PREVIEW_SCALE, height: INVITE_CARD_HEIGHT * PREVIEW_SCALE }}>
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }} className="shadow-float rounded-[22px] w-fit">
              <InviteCard
                ref={cardRef}
                displayName={displayName}
                username={username}
                avatarUrl={profile?.avatar_url}
                friendCode={friendCode}
                banner={isBannerId(profile?.banner) ? profile.banner : undefined}
              />
            </div>
          </div>

          <div className="mt-4 bg-surface-2 border border-border rounded-[18px] px-3.5 py-2.5">
            <p className="text-body-sm font-bold text-primary-text mb-0.5">Va con este mensaje</p>
            <p className="text-body-md text-text-secondary">
              {message} <span className="text-primary-text break-all">{link}</span>
            </p>
          </div>
          {notice && <FormHint text={notice.text} tone={notice.tone} />}
        </>
      ) : (
        <p className="text-body-md text-text-secondary">Cargando tu código…</p>
      )}
    </Sheet>
  )
}
