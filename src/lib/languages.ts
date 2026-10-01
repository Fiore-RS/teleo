// Idiomas de los libros (V.2.2.0). Se guardan como código ISO de dos letras ("es", "en",
// "fr") y se muestran con su nombre en español, sacado de Intl.DisplayNames. Los libros más
// viejos pueden tener el idioma escrito a mano ("Español", "english") o en código de tres
// letras de Open Library ("spa"): normalizeLanguage los reconoce y los lleva al mismo código,
// así el menú, el detalle, el filtro de Estante y las estadísticas los tratan igual.

let displayNames: Intl.DisplayNames | null = null
try {
  displayNames = new Intl.DisplayNames(['es'], { type: 'language' })
} catch {
  displayNames = null
}

// Idiomas con los que se arma el índice de nombres escritos a mano. No limita el menú: ahí
// aparece cualquier idioma que ya tenga algún libro.
const KNOWN_CODES = [
  'es', 'en', 'fr', 'pt', 'it', 'de', 'ca', 'gl', 'eu', 'nl', 'sv', 'da', 'no', 'fi', 'pl',
  'ru', 'uk', 'cs', 'el', 'tr', 'ar', 'he', 'hi', 'ja', 'ko', 'zh', 'la', 'ro', 'hu',
]

// Códigos de tres letras (Open Library y otros catálogos).
const ISO3: Record<string, string> = {
  spa: 'es', eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', por: 'pt', ita: 'it',
  cat: 'ca', glg: 'gl', dut: 'nl', nld: 'nl', rus: 'ru', jpn: 'ja', kor: 'ko', chi: 'zh',
  zho: 'zh', lat: 'la',
}

// Nombres escritos a mano que no salen de Intl (en inglés o variantes).
const EXTRA_NAMES: Record<string, string> = {
  castellano: 'es', spanish: 'es', english: 'en', french: 'fr', portuguese: 'pt',
  italian: 'it', german: 'de', japanese: 'ja', korean: 'ko', chinese: 'zh',
}

function simplify(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

let nameIndex: Map<string, string> | null = null
function getNameIndex(): Map<string, string> {
  if (nameIndex) return nameIndex
  nameIndex = new Map(Object.entries(EXTRA_NAMES))
  for (const code of KNOWN_CODES) {
    const name = displayNames?.of(code)
    if (name) nameIndex.set(simplify(name), code)
  }
  return nameIndex
}

const TWO_LETTER = /^[a-z]{2}$/

/** Lleva cualquier forma de escribir el idioma a su código ("Español" → "es"). Si no se
 *  reconoce, devuelve el texto tal cual (sin espacios de más) para no perder el dato. */
export function normalizeLanguage(value: string | null | undefined): string | null {
  if (!value) return null
  const s = simplify(value)
  if (!s) return null
  const byName = getNameIndex().get(s)
  if (byName) return byName
  if (ISO3[s]) return ISO3[s]
  const withRegion = s.match(/^([a-z]{2})[-_][a-z0-9]+$/)
  if (withRegion) return withRegion[1]
  if (TWO_LETTER.test(s)) return s
  return value.trim()
}

/** Nombre para mostrar ("es" → "Español"). Vacío si el libro no tiene idioma. */
export function languageLabel(value: string | null | undefined): string {
  const code = normalizeLanguage(value)
  if (!code) return ''
  if (TWO_LETTER.test(code)) {
    let name: string | undefined
    try {
      name = displayNames?.of(code)
    } catch {
      name = undefined
    }
    if (name && name !== code) return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return code
}

/** Opciones del menú de idioma: Español e Inglés siempre, más los idiomas que ya tengan los
 *  libros de la persona, sin repetir y ordenados por nombre después de los dos primeros. */
export function languageOptionsFrom(values: (string | null | undefined)[]): { value: string; label: string }[] {
  const extra = new Set<string>()
  for (const v of values) {
    const code = normalizeLanguage(v)
    if (code && code !== 'es' && code !== 'en') extra.add(code)
  }
  const rest = Array.from(extra)
    .map((code) => ({ value: code, label: languageLabel(code) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
  return [
    { value: 'es', label: languageLabel('es') },
    { value: 'en', label: languageLabel('en') },
    ...rest,
  ]
}
