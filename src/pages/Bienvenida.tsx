import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useFinishIntro } from '../hooks/useFinishIntro'
import { useTour } from '../context/tourContextValue'
import { TOUR_STEPS } from '../lib/tour'
import { Button } from '../assets/components/atoms/Button'

/** Bienvenida de una cuenta nueva. V.3.3.0 (propuesta C, "saludo personal", con la foto
 *  centrada; desde la V.4.5.0 en una hoja de cuaderno en todos los tamaños): la foto (o la
 *  inicial) ladeada como en Perfil, "¡Hola,
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

  async function handleStart(withTour: boolean) {
    setChoice(withTour ? 'tour' : 'skip')
    await finishIntro()
    if (withTour) start()
  }

  const foto = (size: string, text: string) => (
    <div className={`relative z-[2] mx-auto ${size} rounded-[34px] border-4 border-bg bg-linear-to-br from-primary to-rose rotate-[4deg] shadow-[0_14px_26px_-14px_rgba(40,20,10,0.6)] flex items-center justify-center overflow-hidden`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={`font-title ${text} leading-none text-primary-ink`}>{initial}</span>
      )}
    </div>
  )

  const saludo = (
    <>
      <h1 className="font-title text-[36px] tableta:text-[40px] leading-[1.05] text-text text-balance">
        {displayName ? `¡Hola, ${displayName}!` : '¡Hola!'}
      </h1>
      {profile?.username && <p className="text-body-md text-text-secondary mt-1">@{profile.username}</p>}
      <p className="font-body text-body-lg text-text-secondary mt-4 text-pretty">
        Tu rincón de lectura está listo. ¿Te mostramos cómo funciona Teleo? Es un tutorial corto, de {TOUR_STEPS.length}{' '}
        pasos, sobre la misma app.
      </p>
    </>
  )

  const botones = (
    <div className="mt-8 tableta:mt-10 flex flex-col gap-2.5">
      <p className="text-body-sm text-text-muted mb-0.5">Puedes verlo cuando quieras desde Configuración.</p>
      <Button variant="primary" onClick={() => handleStart(true)} isLoading={isSaving && choice === 'tour'} disabled={isSaving}>
        Empezar el tutorial
      </Button>
      <Button variant="outline" onClick={() => handleStart(false)} isLoading={isSaving && choice === 'skip'} disabled={isSaving}>
        Ahora no
      </Button>
    </div>
  )

  // La primera hoja de cuaderno, con margen rojo y renglones, centrada sobre el fondo de la mesa
  // y del alto de lo que lleva (tableta y computadora desde la V.4.3.0, lienzo "Tapa ·
  // Bienvenida"; celular desde la V.4.5.0, en lugar del banner). Sin banner ni tapa (Fiorella,
  // 14 nov 2026).
  return (
    <div
      className="min-h-dvh bg-mesa flex items-center justify-center px-4 tableta:p-10"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >
      <div
        className="relative w-full max-w-120 tableta:max-w-160 bg-surface rounded-[10px] shadow-[0_30px_50px_-28px_rgba(60,30,20,0.6)] pt-10 pb-8 pl-13 pr-6 tableta:pt-14 tableta:pb-12 tableta:pl-21 tableta:pr-16 text-center"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in srgb, var(--color-border) 60%, transparent) 31px 32px)',
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-8 tableta:left-14 w-[1.5px]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-rose) 60%, transparent)' }}
        />
        {foto('w-[100px] h-[100px] tableta:w-[112px] tableta:h-[112px]', 'text-[46px] tableta:text-[52px]')}
        <div className="mt-6">{saludo}</div>
        <div className="max-w-90 mx-auto">{botones}</div>
      </div>
    </div>
  )
}
