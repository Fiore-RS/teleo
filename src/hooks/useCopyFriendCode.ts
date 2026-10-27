import { useEffect, useRef, useState } from 'react'
import { formatFriendCode } from '../lib/friendCode'

/** Copia el código de amistad ("TL-K7MQ-4XRA") y deja `copied` en true un par de segundos. */
export function useCopyFriendCode(code: string | null | undefined) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(formatFriendCode(code))
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // Sin permiso para el portapapeles: el código queda a la vista para copiarlo a mano.
    }
  }

  return { copied, copy }
}
