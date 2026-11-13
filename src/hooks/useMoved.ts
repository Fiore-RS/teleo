import { useEffect, useState } from 'react'
import { checkMoved, isOldAddress, knownMoved } from '../lib/moved'

/** true si Teleo ya se mudó a teleo.fiorers.dev y esta es la copia de la dirección vieja. */
export function useMoved(): boolean {
  const [moved, setMoved] = useState(() => isOldAddress() && knownMoved())

  useEffect(() => {
    if (!isOldAddress() || moved) return
    let cancelled = false
    void checkMoved().then((result) => {
      if (!cancelled && result) setMoved(true)
    })
    return () => {
      cancelled = true
    }
  }, [moved])

  return moved
}
