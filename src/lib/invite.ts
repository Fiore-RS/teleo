import { normalizeFriendCode } from './friendCode'

/**
 * Código de invitación guardado durante la visita (V.3.3.0).
 *
 * Al abrir la portada con `#/inicio?codigo=K7MQ4XRA`, el código se guarda en sessionStorage
 * para que no se pierda al pasar a Registro o Instalar. Registro lo manda en
 * `options.data.invite_code` y handle_new_user (0035) guarda quién invitó.
 *
 * Si la persona instala la app desde la invitación, la app instalada no comparte el
 * sessionStorage del navegador y el código se pierde: decidido aceptarlo (20 oct 2026).
 * Todo va en try/catch: en modo privado o con el almacenamiento bloqueado, la invitación
 * solo deja de recordarse, nada se rompe.
 */

const INVITE_STORAGE_KEY = 'teleo-invite-code'

export function saveInviteCode(raw: string | null | undefined): string | null {
  const code = normalizeFriendCode(raw)
  if (!code) return null
  try {
    sessionStorage.setItem(INVITE_STORAGE_KEY, code)
  } catch {
    // Sin almacenamiento: la invitación vale solo para esta pantalla.
  }
  return code
}

export function readInviteCode(): string | null {
  try {
    return normalizeFriendCode(sessionStorage.getItem(INVITE_STORAGE_KEY))
  } catch {
    return null
  }
}

export function clearInviteCode() {
  try {
    sessionStorage.removeItem(INVITE_STORAGE_KEY)
  } catch {
    // Nada que limpiar.
  }
}
