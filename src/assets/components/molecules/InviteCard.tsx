import { forwardRef, useEffect, useState } from 'react'
import logoFullCream from '../../images/logo/logo-full-dark.svg'
import { BannerArt } from '../atoms/BannerArt'
import { DEFAULT_BANNER, type BannerId } from '../../../lib/banners'
import { shareSafeImageUrl } from '../../../lib/shareImage'
import { buildInviteLink, formatFriendCode } from '../../../lib/friendCode'

/** Tamaño en pantalla; se exporta con pixelRatio 3: 1080 × 1920, como la tarjeta de perfil. */
export const INVITE_CARD_WIDTH = 360
export const INVITE_CARD_HEIGHT = 640

/** El QR siempre va oscuro sobre crema, también en modo oscuro: un QR claro sobre oscuro no lo
 *  leen todas las cámaras. */
const QR_DARK = '#2B211B'
const QR_LIGHT = '#FFF8EE'

/** El QR como imagen (data URL), generado con la librería `qrcode`, que se carga recién al abrir
 *  la hoja de invitación. Mientras se genera, el cuadro queda vacío. */
function useQrDataUrl(text: string) {
  const [url, setUrl] = useState<{ text: string; src: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(text, {
          errorCorrectionLevel: 'M',
          margin: 0,
          width: 360,
          color: { dark: QR_DARK, light: QR_LIGHT },
        }),
      )
      .then((src) => {
        if (!cancelled) setUrl({ text, src })
      })
      .catch((err) => console.error('[InviteCard] No se pudo generar el QR:', err))
    return () => {
      cancelled = true
    }
  }, [text])

  return url?.text === text ? url.src : null
}

export interface InviteCardProps {
  displayName: string
  username: string
  avatarUrl: string | null | undefined
  friendCode: string
  banner?: BannerId
}

/** Tarjeta de invitación (V.3.3.0, vista previa B): la forma de la tarjeta de perfil (banner,
 *  foto ladeada, nombre y @), "Te invito a Teleo", una frase y un rectángulo con
 *  el QR del enlace y el código al lado. Usa los colores del tema activo. Solo presentación:
 *  InviteSheet hace la captura con html-to-image. */
export const InviteCard = forwardRef<HTMLDivElement, InviteCardProps>(function InviteCard(
  { displayName, username, avatarUrl, friendCode, banner = DEFAULT_BANNER },
  ref,
) {
  const qrSrc = useQrDataUrl(buildInviteLink(friendCode))
  const avatarSrc = shareSafeImageUrl(avatarUrl, 400)
  const appUrl = `${window.location.host}${import.meta.env.BASE_URL}`.replace(/\/$/, '')
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div
      ref={ref}
      style={{ width: INVITE_CARD_WIDTH, height: INVITE_CARD_HEIGHT }}
      className="relative overflow-hidden rounded-[22px] bg-bg bg-glow-top text-text flex flex-col"
    >
      <div className="relative aspect-18/7 shrink-0 rounded-b-[26px] overflow-hidden bg-linear-to-br from-primary to-rose">
        <BannerArt banner={banner} />
        <img src={logoFullCream} alt="Teleo" className="absolute top-4 right-[18px] h-[30px] w-auto" />
      </div>

      <div className="relative flex items-end gap-3.5 px-5 -mt-11">
        <div
          className={`w-[104px] h-[104px] shrink-0 rounded-[28px] border-[3px] border-bg overflow-hidden rotate-[4deg] flex items-center justify-center shadow-[0_10px_20px_-12px_rgba(40,20,10,0.6)] ${
            avatarSrc ? 'bg-bg' : 'bg-linear-to-br from-primary to-rose'
          }`}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" />
          ) : (
            <span className="font-title text-[48px] leading-none text-primary-ink">{initial}</span>
          )}
        </div>
        <div className="min-w-0 pb-1">
          <p className="font-title text-[26px] leading-none text-text truncate">{displayName}</p>
          <p className="text-[13px] text-text-secondary mt-1 truncate">@{username}</p>
        </div>
      </div>

      <div className="px-5 pt-[26px]">
        <p className="font-title text-[36px] leading-[1.05] text-text">Te invito a Teleo</p>
        <p className="text-[14px] leading-[1.45] text-text-secondary mt-2">
          Mi diario de lectura: lo que leo, lo que me encanta y lo que sigue en la lista.
        </p>
      </div>

      <div className="px-5 mt-[26px]">
        {/* Rectángulo simple, sin pestaña (decidido el 22 oct 2026): deja más aire entre los
            elementos de la tarjeta. */}
        <div className="bg-surface border border-border rounded-[22px] shadow-card py-4 pl-4 pr-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-[140px] h-[140px] shrink-0 rounded-[14px] border border-border p-2.5" style={{ background: QR_LIGHT }}>
              {qrSrc && <img src={qrSrc} alt="" className="w-full h-full block" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-primary-text">Mi código de Teleo</p>
              <p className="font-body font-extrabold text-[17px] tracking-[0.05em] tabular-nums whitespace-nowrap text-text mt-0.5">
                {formatFriendCode(friendCode)}
              </p>
              <p className="text-[12px] leading-[1.4] text-text-secondary mt-2.5">
                Escanea el código con la cámara o entra a <span className="font-bold text-text">{appUrl}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto shrink-0 flex items-center justify-between px-5 pt-3 pb-4">
        <p className="font-title text-[18px] text-primary-text">
          Teleo <span className="font-body text-[11px] text-text-secondary">a mi manera</span>
        </p>
        <p className="text-[10.5px] text-text-muted">{appUrl}</p>
      </div>
    </div>
  )
})
