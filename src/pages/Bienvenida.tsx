import { useState } from 'react'
import logoFullCream from '../assets/images/logo/logo-full-dark.svg'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useFinishIntro } from '../hooks/useFinishIntro'
import { useTour } from '../context/tourContextValue'
import { TOUR_STEPS } from '../lib/tour'
import { DEFAULT_BANNER, isBannerId } from '../lib/banners'
import { Button } from '../assets/components/atoms/Button'
import { BannerArt } from '../assets/components/atoms/BannerArt'

/** Bienvenida de una cuenta nueva. V.3.3.0 (propuesta C, "saludo personal", con la foto
 *  centrada): el banner de marca y la foto (o la inicial) ladeada como en Perfil, "¡Hola,
 *  nombre!" y la invitación al Tutorial, que ahora es el recorrido sobre la app. El detalle de
 *  cada sección vive en la Guía de Teleo. Los dos botones marcan has_seen_intro. */
export function Bienvenida() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { finishIntro, isSaving } = useFinishIntro()
  const { start } = useTour()
  const [choice, setChoice] = useState<'tour' | 'skip' | null>(null)

  const displayName = profile?.nickname?.trim() || profile?.username || ''
  const initial = displayName.charAt(0).toUpperCase()
  const banner = isBannerId(profile?.banner) ? profile.banner : DEFAULT_BANNER

  async function handleStart(withTour: boolean) {
    setChoice(withTour ? 'tour' : 'skip')
    await finishIntro()
    if (withTour) start()
  }

  return (
    <div className="min-h-dvh bg-glow-top">
      <div className="mx-auto w-full max-w-120 min-h-dvh flex flex-col">
        {/* Banner con el dibujo completo (360 × 140) y el logo claro encima. */}
        <div className="relative shrink-0 rounded-b-[30px] overflow-hidden bg-linear-to-br from-primary to-rose">
          <div className="relative aspect-18/7">
            <BannerArt banner={banner} />
          </div>
          <div className="h-10" />
          <img
            src={logoFullCream}
            alt="Teleo"
            className="absolute left-5 h-7 w-auto"
            style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
          />
        </div>

        {/* Foto centrada, montada sobre el borde del banner. */}
        <div className="relative z-[2] -mt-16 mx-auto w-[120px] h-[120px] rounded-[34px] border-4 border-bg bg-linear-to-br from-primary to-rose rotate-[4deg] shadow-[0_14px_26px_-14px_rgba(40,20,10,0.6)] flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-title text-[56px] leading-none text-primary-ink">{initial}</span>
          )}
        </div>

        <div
          className="flex flex-col px-6 pt-5 text-center"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
        >
          <h1 className="font-title text-[36px] leading-[1.05] text-text text-balance">
            {displayName ? `¡Hola, ${displayName}!` : '¡Hola!'}
          </h1>
          {profile?.username && <p className="text-body-md text-text-secondary mt-1">@{profile.username}</p>}
          <p className="font-body text-body-lg text-text-secondary mt-4 text-pretty">
            Tu rincón de lectura está listo. ¿Te mostramos cómo funciona Teleo? Es un tutorial corto, de {TOUR_STEPS.length}{' '}
            pasos, sobre la misma app.
          </p>

          <div className="mt-14 flex flex-col gap-2.5">
            <p className="text-body-sm text-text-muted mb-0.5">Puedes verlo cuando quieras desde Configuración.</p>
            <Button variant="primary" onClick={() => handleStart(true)} isLoading={isSaving && choice === 'tour'} disabled={isSaving}>
              Empezar el tutorial
            </Button>
            <Button variant="outline" onClick={() => handleStart(false)} isLoading={isSaving && choice === 'skip'} disabled={isSaving}>
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
