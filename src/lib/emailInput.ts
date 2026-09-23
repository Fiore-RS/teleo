import type { InputHTMLAttributes } from 'react'

/** Atributos para los campos de correo: sin mayúscula automática ni autocorrector del
 *  teclado del celular (cambiaban "Fiorella@..." y el inicio de sesión fallaba), y con el
 *  teclado de correo. Se usan con `<Input {...emailInputProps} ... />`. */
export const emailInputProps: InputHTMLAttributes<HTMLInputElement> = {
  type: 'email',
  inputMode: 'email',
  autoComplete: 'email',
  autoCapitalize: 'none',
  autoCorrect: 'off',
  spellCheck: false,
}
