import { Card } from './Card'
import { inviterDisplayName, type InviterPreview } from '../../../hooks/useInviterPreview'

/** Foto de quien invita: cuadrada y ladeada como en Perfil, o su inicial sobre el degradado. */
export function InviterAvatar({ inviter, size = 'md' }: { inviter: InviterPreview; size?: 'md' | 'sm' }) {
  const name = inviterDisplayName(inviter)
  const box =
    size === 'md'
      ? 'w-13 h-13 rounded-[15px] border-[2.5px] text-[24px]'
      : 'w-7 h-7 rounded-[9px] border-[1.5px] text-[14px]'
  return (
    <span
      aria-hidden="true"
      className={`${box} shrink-0 rotate-[4deg] border-surface overflow-hidden flex items-center justify-center font-title leading-none text-primary-ink shadow-[0_6px_14px_-8px_rgba(40,20,10,0.6)] ${
        inviter.avatar_url ? 'bg-surface' : 'bg-linear-to-br from-primary to-rose'
      }`}
    >
      {inviter.avatar_url ? (
        <img src={inviter.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  )
}

/** Tarjeta "Invitación" de la portada (V.3.3.0, vista previa A): quién te invitó, con su foto,
 *  nombre y @. Sale de `inviter_preview`; si el código no existe, la portada no la muestra. */
export function InviterCard({ inviter }: { inviter: InviterPreview }) {
  const name = inviterDisplayName(inviter)
  return (
    <Card tab={{ label: 'Invitación' }} as="div" padding="py-4 pl-3.5 pr-4">
      <div className="flex items-center gap-3.5">
        <InviterAvatar inviter={inviter} />
        <div className="min-w-0">
          <p className="font-title text-[19px] leading-[1.2] text-text text-balance">{name} te invitó a Teleo</p>
          <p className="text-body-sm text-text-secondary mt-0.5 truncate">@{inviter.username} · su diario de lectura</p>
        </div>
      </div>
    </Card>
  )
}
