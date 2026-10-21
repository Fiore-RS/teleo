/**
 * Código de amistad de cada cuenta (V.3.3.0), como el código de amigo de Steam.
 *
 * En la base se guarda sin prefijo ni guion ("K7MQ4XRA", columna `profiles.friend_code`) y se
 * muestra como "TL-K7MQ-4XRA". Al escribirlo se acepta con o sin "TL-", con o sin guiones o
 * espacios, en mayúsculas o minúsculas. El alfabeto no tiene los caracteres que se confunden
 * (0, O, 1, I, L) y coincide con `generate_friend_code()` y `normalize_friend_code()` de
 * supabase/migrations/0035_llegar_a_teleo.sql.
 */

export const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const FRIEND_CODE_LENGTH = 8
export const FRIEND_CODE_PREFIX = 'TL'

const VALID_CODE = new RegExp(`^[${FRIEND_CODE_ALPHABET}]{${FRIEND_CODE_LENGTH}}$`)

/** Limpia lo que se escribe o llega en un enlace. Devuelve el código guardable o null. */
export function normalizeFriendCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  let cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length === FRIEND_CODE_LENGTH + FRIEND_CODE_PREFIX.length && cleaned.startsWith(FRIEND_CODE_PREFIX)) {
    cleaned = cleaned.slice(FRIEND_CODE_PREFIX.length)
  }
  return VALID_CODE.test(cleaned) ? cleaned : null
}

export function isValidFriendCode(raw: string | null | undefined): boolean {
  return normalizeFriendCode(raw) !== null
}

/** "K7MQ4XRA" → "TL-K7MQ-4XRA". Si no es un código válido, devuelve el texto tal cual. */
export function formatFriendCode(code: string | null | undefined): string {
  const normalized = normalizeFriendCode(code)
  if (!normalized) return code ?? ''
  return `${FRIEND_CODE_PREFIX}-${normalized.slice(0, 4)}-${normalized.slice(4)}`
}

/** Enlace de invitación: la portada con el código. Se arma con la dirección actual y la base
 *  de Vite, nunca escrito a mano, para que funcione igual en localhost y en fiorers.dev. */
export function buildInviteLink(code: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${window.location.origin}${base}#/inicio?codigo=${encodeURIComponent(normalizeFriendCode(code) ?? code)}`
}
