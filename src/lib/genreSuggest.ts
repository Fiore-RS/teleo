import { MAX_GENRES, type GenreKey } from './bookTraits'

/** Sugerencia de género (V.3.1.0): convierte las categorías y temas que dan Google Books, Open
 *  Library y AniList ("Juvenile Fiction / Fantasy & Magic", "Boys' Love", "Romance"...) a la
 *  lista de géneros de Teleo. Cada tema puede sumar a varios géneros; gana el que más temas
 *  junta. Lo genérico ("Fiction", "Comics & Graphic Novels") no suma a nada. */

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const RULES: { genre: GenreKey; patterns: RegExp[] }[] = [
  { genre: 'bl', patterns: [/\bbl\b/, /boys'? ?love/, /danmei/, /yaoi/, /shou?nen[- ]ai/, /\bgay\b/, /\bm\/m\b/, /\bmlm\b/] },
  { genre: 'gl', patterns: [/\bgl\b/, /girls'? ?love/, /\byuri\b/, /baihe/, /lesbian/, /\bwlw\b/, /\bf\/f\b/, /shou?jo[- ]ai/] },
  { genre: 'fantasy', patterns: [/fantas/, /magic/, /\bmagia\b/, /dragon/, /xianxia/, /wuxia/, /cultivation/, /sword (and|&) sorcery/, /\bmytholog/] },
  { genre: 'romance', patterns: [/romance/, /love stor/, /novela romantica/, /\bamor\b/] },
  { genre: 'scifi', patterns: [/science fiction/, /sci-?fi/, /ciencia ficcion/, /dystop/, /distop/, /space opera/, /cyberpunk/, /time travel/] },
  { genre: 'mystery', patterns: [/myster/, /misterio/, /detective/, /policiac/, /policial/, /whodunit/, /\bcrime\b/] },
  { genre: 'thriller', patterns: [/thriller/, /suspense/, /suspenso/] },
  { genre: 'horror', patterns: [/horror/, /\bterror\b/, /ghost stor/, /zombie/] },
  { genre: 'historical', patterns: [/historical fiction/, /historical romance/, /ficcion historica/, /novela historica/, /fiction.*historical/] },
  { genre: 'contemporary', patterns: [/contemporary/, /contemporanea/, /realistic fiction/, /literary fiction/, /slice of life/, /domestic fiction/] },
  { genre: 'young_adult', patterns: [/young adult/, /juvenile fiction/, /\bjuvenil\b/, /\bteen/, /coming of age/] },
  { genre: 'classics', patterns: [/\bclassics?\b/, /\bclasicos?\b/] },
  { genre: 'poetry', patterns: [/poetry/, /poesia/, /\bpoems\b/, /poemas/] },
  {
    genre: 'nonfiction',
    patterns: [
      /non-?fiction/, /no ficcion/, /biograph/, /memoir/, /autobiograph/, /self-help/, /autoayuda/, /\bessays?\b/, /\bensayos?\b/,
      /^(history|psychology|philosophy|business|social science|science(?! fiction)|religion|cooking|education|health|political science|true crime|travel)\b/,
    ],
  },
]

/** Hasta MAX_GENRES géneros sugeridos, del más al menos respaldado por los temas. */
export function suggestGenres(subjects: string[]): GenreKey[] {
  const scores = new Map<GenreKey, number>()
  for (const raw of subjects) {
    const subject = normalize(raw)
    for (const { genre, patterns } of RULES) {
      if (patterns.some((p) => p.test(subject))) scores.set(genre, (scores.get(genre) ?? 0) + 1)
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GENRES)
    .map(([genre]) => genre)
}
