import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js'

/**
 * Mensajes de error de inicio de sesión y cuenta (V.3.0.1).
 *
 * Se decide con el `code` y el `status` del error de Supabase, nunca con el texto del
 * mensaje (que está en inglés y puede cambiar). Cada pantalla dice qué estaba haciendo
 * (`action`) para que el mensaje genérico y algunos casos puntuales encajen con ella.
 */
export type AuthAction = 'login' | 'signup' | 'reset' | 'newPassword' | 'changeEmail' | 'changePassword'

const NETWORK = 'No pudimos conectar con Teleo. Revisa tu conexión e inténtalo de nuevo.'
const SERVER = 'Teleo no pudo responder en este momento. Inténtalo de nuevo en unos minutos.'

const FALLBACK: Record<AuthAction, string> = {
  login: 'No pudimos iniciar sesión. Inténtalo de nuevo.',
  signup: 'No pudimos crear tu cuenta. Inténtalo de nuevo.',
  reset: 'No se pudo enviar el correo. Inténtalo de nuevo.',
  newPassword: 'No se pudo guardar la contraseña. Inténtalo de nuevo.',
  changeEmail: 'No se pudo cambiar el correo. Inténtalo de nuevo.',
  changePassword: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
}

function tooManyAttempts(action: AuthAction): string {
  if (action === 'reset') return 'Ya pediste un enlace hace poco. Espera un minuto y vuelve a intentarlo.'
  if (action === 'signup' || action === 'changeEmail') {
    return 'Enviamos varios correos hace poco. Espera unos minutos y vuelve a intentarlo.'
  }
  return 'Hiciste varios intentos seguidos. Espera un momento y vuelve a intentarlo.'
}

function expiredSession(action: AuthAction): string {
  if (action === 'newPassword') {
    return 'El enlace ya venció. Pide uno nuevo desde "¿Olvidaste tu contraseña?".'
  }
  return 'Tu sesión venció. Vuelve a iniciar sesión e inténtalo de nuevo.'
}

export function authErrorMessage(error: unknown, action: AuthAction): string {
  // Sin internet: Supabase devuelve un error "reintentable" con status 0.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return NETWORK
  if (isAuthRetryableFetchError(error)) return error.status === 0 ? NETWORK : SERVER
  if (!isAuthError(error)) return FALLBACK[action]

  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.'
    case 'email_not_confirmed':
      return 'Confirma tu correo antes de iniciar sesión.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return tooManyAttempts(action)
    case 'same_password':
      return 'La contraseña nueva tiene que ser distinta a la anterior.'
    case 'weak_password':
      return 'Esa contraseña es muy fácil de adivinar. Prueba con una más larga.'
    case 'email_address_invalid':
      return 'Revisa que el correo esté bien escrito.'
    case 'email_exists':
    case 'user_already_exists':
      return action === 'signup'
        ? 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.'
        : 'Ese correo ya lo usa otra cuenta de Teleo.'
    case 'signup_disabled':
      return 'Por ahora no se pueden crear cuentas nuevas.'
    case 'reauthentication_needed':
      return 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar tu contraseña.'
    case 'session_not_found':
    case 'session_expired':
    case 'bad_jwt':
    case 'otp_expired':
      return expiredSession(action)
  }

  if (error.status === 429) return tooManyAttempts(action)

  // Al registrarse, el perfil se crea con un trigger y el nombre de usuario es único:
  // si ya existe, Supabase solo dice "unexpected_failure" (500). No se puede saber con
  // certeza desde aquí, así que el mensaje cubre los dos casos.
  if (action === 'signup' && error.code === 'unexpected_failure') {
    return 'No pudimos crear tu cuenta. Si ese nombre de usuario ya lo usa otra persona, prueba con otro.'
  }

  if (error.status !== undefined && error.status >= 500) return SERVER
  return FALLBACK[action]
}
