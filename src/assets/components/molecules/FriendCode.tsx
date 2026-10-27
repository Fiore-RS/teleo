import { Check, Copy, QrCode } from 'lucide-react'
import { formatFriendCode } from '../../../lib/friendCode'
import { useCopyFriendCode } from '../../../hooks/useCopyFriendCode'

function CopyPill({ copied }: { copied: boolean }) {
  return copied ? (
    <span className="inline-flex items-center gap-1 shrink-0 px-1 py-1.5 text-body-sm font-bold text-accent-finished animate-fade-in">
      <Check size={14} strokeWidth={2.6} aria-hidden="true" />
      Copiado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-primary-soft text-primary-text px-3 py-1.5 text-body-sm font-bold">
      <Copy size={14} strokeWidth={2.2} aria-hidden="true" />
      Copiar
    </span>
  )
}

/** Código destacado arriba de la hoja Compartir de Perfil (V.3.3.0, vista previa B). Toda la
 *  caja copia el código. */
export function FriendCodeBox({ code }: { code: string | null | undefined }) {
  const { copied, copy } = useCopyFriendCode(code)
  if (!code) return null
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar tu código de Teleo, ${formatFriendCode(code)}`}
      className="w-full flex items-center gap-3 bg-surface-2 border border-border rounded-[18px] px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-body-sm font-bold text-primary-text">Tu código de Teleo</span>
        <span className="block font-body font-extrabold text-[21px] leading-tight tracking-[0.08em] tabular-nums text-text mt-0.5">
          {formatFriendCode(code)}
        </span>
      </span>
      <CopyPill copied={copied} />
    </button>
  )
}

/** Fila "Tu código de Teleo" de Configuración › Compartir: mismo aspecto que SettingsRow,
 *  pero sin flecha; tocarla copia el código. */
export function FriendCodeSettingsRow({ code }: { code: string | null | undefined }) {
  const { copied, copy } = useCopyFriendCode(code)
  if (!code) return null
  return (
    <button
      type="button"
      onClick={copy}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-text"
    >
      <span className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
        <QrCode size={17} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-body font-semibold text-body-md text-text">Tu código de Teleo</span>
        <span className="block font-body font-extrabold text-body-md tracking-[0.08em] tabular-nums text-text-secondary mt-0.5">
          {formatFriendCode(code)}
        </span>
      </span>
      <CopyPill copied={copied} />
    </button>
  )
}
