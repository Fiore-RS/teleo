/** Colores de las tarjetas de "Tu lectura en Teleo" (V.3.2.0). Cada tarjeta usa, en orden, uno
 *  de los cuatro colores del tema activo (principal, naranja de botón, rosa y magenta).
 *
 *  Decidido con Fiorella (13 oct 2026): el texto sobre el fondo es siempre blanco. Los acentos
 *  claros (que en la app llevan texto oscuro) se oscurecen lo justo para que el blanco se lea, y
 *  en modo oscuro se oscurecen más. El "papel" (ficha, ticket, cinta, etiquetas) es casi blanco
 *  con un toque del color de la tarjeta, y sigue claro en los dos modos para que la imagen
 *  compartida se lea en cualquier lugar. Los colores salen ya calculados en hexadecimal, así la
 *  imagen exportada no depende de color-mix. */

export interface RecapTone {
  /** Fondo de la tarjeta. */
  bg: string
  /** Texto sobre el fondo. */
  ink: string
  /** Papel claro y su texto. */
  paper: string
  paperInk: string
  /** Color de acento legible sobre el papel. */
  accentInk: string
}

const TONE_TOKENS = ['--teleo-primary', '--teleo-orange-button', '--teleo-pink', '--teleo-magenta']
const WHITE: Rgb = [255, 255, 255]
const PAPER_BASE: Rgb = [255, 253, 248]
const INK_BASE: Rgb = [28, 21, 19]

type Rgb = [number, number, number]

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace('#', '')
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return null
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb
}

const toHex = (c: Rgb) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const mix = (a: Rgb, b: Rgb, amountOfA: number): Rgb => a.map((v, i) => v * amountOfA + b[i] * (1 - amountOfA)) as Rgb

function luminance(c: Rgb) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const hue = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return [hue / 6, sat, l]
}

function fromHsl([h, sat, l]: [number, number, number]): Rgb {
  if (sat === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat
  const p = 2 * l - q
  const channel = (t: number) => {
    const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255]
}

/** Baja la luz del color (sin perder el tono) hasta que contraste lo pedido contra `against`.
 */
function darkenUntil(color: Rgb, against: Rgb, target: number): Rgb {
  const [h, sat, l] = toHsl(color)
  let out = color
  for (let light = l; contrast(out, against) < target && light > 0.05; light -= 0.01) {
    out = fromHsl([h, sat, light])
  }
  return out
}

export function toneFromColor(value: string, dark: boolean): RecapTone {
  const base = parseHex(value) ?? [122, 46, 58]
  // En oscuro, el acento del tema (que ahí es claro) se mezcla con negro, como en la vista
  // previa aprobada; en claro, se oscurece solo lo necesario para que el blanco se lea.
  const bg = dark ? darkenUntil(mix(base, [0, 0, 0], 0.52), WHITE, 4.5) : darkenUntil(base, WHITE, 4)
  const paper = mix(bg, PAPER_BASE, 0.05)
  return {
    bg: toHex(bg),
    ink: '#FFFFFF',
    paper: toHex(paper),
    paperInk: toHex(mix(bg, INK_BASE, 0.15)),
    accentInk: toHex(darkenUntil(bg, paper, 4.6)),
  }
}

/** Los cuatro colores del tema activo, leídos de las variables de index.css. */
export function readRecapTones(): RecapTone[] {
  const root = document.documentElement
  const styles = getComputedStyle(root)
  const dark = root.classList.contains('dark')
  return TONE_TOKENS.map((token) => toneFromColor(styles.getPropertyValue(token), dark))
}
