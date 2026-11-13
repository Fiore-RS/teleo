/** Mudanza a teleo.fiorers.dev (V.3.8.1).
 *
 *  La app instalada guarda una copia de Teleo en el dispositivo y la abre desde ahí. Después
 *  de la mudanza, esa copia vieja (en fiorers.dev/teleo) puede no volver a actualizarse
 *  nunca, así que el aviso tiene que venir ya dentro de ella. Cada vez que se abre, revisa si
 *  la dirección nueva ya tiene a Teleo publicada: antes de la mudanza responde con un 404 de
 *  GitHub, y después con el manifest de la app. */

export const NEW_ORIGIN = 'https://teleo.fiorers.dev'

/** Dirección vieja: solo ahí tiene sentido revisar (no en localhost ni en la nueva). */
export function isOldAddress(): boolean {
  return window.location.hostname === 'fiorers.dev'
}

const MOVED_KEY = 'teleo-mudanza-hecha'

/** Una vez que se supo que Teleo se mudó, se recuerda en el dispositivo: así el aviso sale
 *  al instante en las aperturas siguientes, aunque no haya conexión. */
export function knownMoved(): boolean {
  try {
    return localStorage.getItem(MOVED_KEY) === '1'
  } catch {
    return false
  }
}

export async function checkMoved(): Promise<boolean> {
  try {
    const res = await fetch(`${NEW_ORIGIN}/manifest.webmanifest`, { cache: 'no-store' })
    if (!res.ok) return false
    try {
      localStorage.setItem(MOVED_KEY, '1')
    } catch {
      // Sin almacenamiento disponible: se vuelve a revisar en la próxima apertura.
    }
    return true
  } catch {
    // Sin conexión o la dirección nueva todavía no existe.
    return false
  }
}

/** La misma pantalla en la dirección nueva (lo que va después del #, para que las
 *  invitaciones viejas sigan funcionando). */
export function newAddressUrl(): string {
  return `${NEW_ORIGIN}/${window.location.hash}`
}
