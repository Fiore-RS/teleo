/**
 * Reglas del @usuario (V.3.3.0, decisión del 20 de octubre de 2026): solo minúsculas, números,
 * punto y guion bajo, entre 3 y 30 caracteres. Rigen al registrarse y al cambiar el @; las
 * cuentas que ya existían pueden tener otro formato y siguen funcionando. Coincide con el
 * trigger `enforce_username_format()` de supabase/migrations/0035_llegar_a_teleo.sql.
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30

export type UsernameIssue = 'short' | 'long' | 'chars'

/** Lo que se escribe pasa a minúsculas y pierde la @ del inicio. Los espacios y otros
 *  caracteres se dejan, para que se vea el aviso de formato en vez de borrarlos sin avisar. */
export function cleanUsernameInput(raw: string): string {
  return raw.replace(/^@+/, '').toLowerCase()
}

export function getUsernameIssue(name: string): UsernameIssue | null {
  if (!/^[a-z0-9._]*$/.test(name)) return 'chars'
  if (name.length < USERNAME_MIN) return 'short'
  if (name.length > USERNAME_MAX) return 'long'
  return null
}

export function usernameIssueMessage(issue: UsernameIssue): string {
  if (issue === 'chars') return 'Solo letras, números, punto y guion bajo, sin espacios.'
  if (issue === 'short') return `Al menos ${USERNAME_MIN} caracteres.`
  return `Máximo ${USERNAME_MAX} caracteres.`
}

export function usernameTakenMessage(name: string): string {
  return `@${name} ya está en uso. Prueba con otro.`
}

export function usernameFreeMessage(name: string): string {
  return `@${name} está libre.`
}
