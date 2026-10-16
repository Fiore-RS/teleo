import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { RecapCard, RECAP_CARD_WIDTH } from './RecapCard'
import { useRecap } from '../../../hooks/useRecap'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { readRecapTones } from '../../../lib/recapTones'
import type { RecapCardId } from '../../../lib/recap'

const MINI_SCALE = 0.3

interface RecapYearAnnouncementProps {
  userId: string | undefined
  year: number
  onOpen: () => void
  onDismiss: () => void
}

/** Anuncio de diciembre en La mesa (V.3.2.0): "Tu año en Teleo ya está listo", con tres de tus
 *  tarjetas reales en miniatura. */
export function RecapYearAnnouncement({ userId, year, onOpen, onDismiss }: RecapYearAnnouncementProps) {
  const { recap, isLoading } = useRecap(userId, { kind: 'anio', year })
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const [tones] = useState(readRecapTones)
  // Portada, libros y la tarjeta más llamativa que haya (favorito, o el ticket).
  const third: RecapCardId = recap.cards.includes('favorito') ? 'favorito' : 'cierre'
  const minis: RecapCardId[] = ['portada', 'libros', third]

  return (
    <Sheet title="Novedades de Teleo" onClose={onDismiss}>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-primary-text">Llegó diciembre</p>
      <h3 className="font-title text-[24px] leading-tight text-primary-text mt-1">Tu {year} en Teleo ya está listo</h3>
      <div className="flex justify-center gap-2 my-5" aria-hidden="true">
        {minis.map((card, k) => (
          <div
            key={card}
            className="overflow-hidden rounded-[10px] shadow-float shrink-0"
            style={{
              width: RECAP_CARD_WIDTH * MINI_SCALE,
              height: ((RECAP_CARD_WIDTH * 16) / 9) * MINI_SCALE,
              transform: `rotate(${[-6, 0, 6][k]}deg)`,
            }}
          >
            {isLoading ? (
              <div className="w-full h-full bg-surface-2 animate-pulse" />
            ) : (
              <div style={{ width: RECAP_CARD_WIDTH, transform: `scale(${MINI_SCALE})`, transformOrigin: 'top left' }}>
                <RecapCard
                  card={card}
                  recap={recap}
                  tone={tones[recap.cards.indexOf(card) % tones.length]}
                  username={profile?.username ?? null}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-body-md text-text-secondary">
        Tus libros, tu mes más lector, tus géneros y tu favorito del año, en tarjetas para compartir.
      </p>
      <p className="text-body-sm text-text-muted mt-2">También está siempre en Bitácora, en Resumen › Año.</p>
      <div className="flex gap-2.5 mt-5">
        <Button variant="outline" fullWidth onClick={onDismiss}>
          Ahora no
        </Button>
        <Button variant="primary" fullWidth onClick={onOpen}>
          Ver mi año
        </Button>
      </div>
    </Sheet>
  )
}
