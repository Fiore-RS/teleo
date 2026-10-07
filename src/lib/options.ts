// Opciones compartidas de categoría y formato (los idiomas salen de lib/languages.ts) — usadas al crear libros manualmente
// y en el modal de Filtros del Estante.

export const categoryOptions = [
  { value: 'Libro', label: 'Libro' },
  { value: 'Novela', label: 'Novela' },
  { value: 'Novela gráfica', label: 'Novela gráfica' },
  { value: 'Novela ligera', label: 'Novela ligera' },
  { value: 'Cómic', label: 'Cómic' },
  { value: 'Manga', label: 'Manga' },
  { value: 'Manhua', label: 'Manhua' },
  { value: 'Manhwa', label: 'Manhwa' },
]

export type BookFormat = 'fisico' | 'digital' | 'audiolibro'

export const formatOptions: { value: BookFormat; label: string }[] = [
  { value: 'fisico', label: 'Físico' },
  { value: 'digital', label: 'Digital' },
  { value: 'audiolibro', label: 'Audiolibro' },
]

/** Categoría en plural y minúscula para las frases de Bitácora ("sobre todo novelas").
 *  "Libro" devuelve null: "467 libros, sobre todo libros" no dice nada. */
const CATEGORY_PLURAL: Record<string, string> = {
  Novela: 'novelas',
  'Novela gráfica': 'novelas gráficas',
  'Novela ligera': 'novelas ligeras',
  Cómic: 'cómics',
  Manga: 'manga',
  Manhua: 'manhua',
  Manhwa: 'manhwa',
}
export function categoryPlural(label: string | null | undefined): string | null {
  if (!label || label === 'Libro') return null
  return CATEGORY_PLURAL[label] ?? label.toLowerCase()
}
