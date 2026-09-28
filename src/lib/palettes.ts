/** Temas de color de Teleo (V.2.1.0). Los colores completos de cada tema viven en
 *  index.css (bloques [data-palette]); aquí solo está lo que necesita la app para mostrar
 *  la lista: nombre, descripción y una muestra de colores para la vista previa.
 *  Los ids también están en la restricción de la columna profiles.palette (0028). */

export type PaletteId =
  | 'atardecer'
  | 'oceano'
  | 'bosque'
  | 'tinta'
  | 'aurora'
  | 'dracula'
  | 'biblioteca'
  | 'algodon'
  | 'lavanda'
  | 'girasol'

export interface PaletteSwatch {
  bg: string
  surface: string
  border: string
  text: string
  primary: string
  primaryInk: string
  /** Los tres acentos, en el orden de naranja, rosa y magenta de Atardecer. */
  accents: [string, string, string]
}

export interface Palette {
  id: PaletteId
  name: string
  description: string
  light: PaletteSwatch
  dark: PaletteSwatch
}

export const DEFAULT_PALETTE: PaletteId = 'atardecer'

export const palettes: Palette[] = [
  {
    id: 'atardecer',
    name: 'Atardecer',
    description: 'El vino del ícono, con naranja, rosa y magenta.',
    light: {
      bg: '#F4ECE0',
      surface: '#FCF8F0',
      border: '#E8DACB',
      text: '#2B211B',
      primary: '#7A2E3A',
      primaryInk: '#FFF8EE',
      accents: [
        '#EC8A4F',
        '#D46BA6',
        '#A8286F'
      ]
    },
    dark: {
      bg: '#1C1513',
      surface: '#271D1B',
      border: '#3D2D2A',
      text: '#F3E9DA',
      primary: '#A8465A',
      primaryInk: '#FFF4EC',
      accents: [
        '#EE8A4E',
        '#DC79B1',
        '#C24A88'
      ]
    }
  },
  {
    id: 'oceano',
    name: 'Océano',
    description: 'Agua turquesa, arena al sol y verde de costa.',
    light: {
      bg: '#F7F1E7',
      surface: '#FFFCF7',
      border: '#E7DCCB',
      text: '#2B211B',
      primary: '#1E6E6F',
      primaryInk: '#F7FDFC',
      accents: [
        '#4EC6D4',
        '#F2D9B7',
        '#7AC7BD'
      ]
    },
    dark: {
      bg: '#0E1A1B',
      surface: '#152425',
      border: '#274041',
      text: '#F3E9DA',
      primary: '#237F80',
      primaryInk: '#F4FFFE',
      accents: [
        '#4EC6D4',
        '#E2C08F',
        '#7AC7BD'
      ]
    }
  },
  {
    id: 'bosque',
    name: 'Bosque',
    description: 'Musgo, hojas al sol, lino y corteza.',
    light: {
      bg: '#F6F3E6',
      surface: '#FFFDF5',
      border: '#E4DECA',
      text: '#2B211B',
      primary: '#365004',
      primaryInk: '#FAFCEF',
      accents: [
        '#925E06',
        '#8DA432',
        '#EDE383'
      ]
    },
    dark: {
      bg: '#16130A',
      surface: '#211C10',
      border: '#3A331F',
      text: '#F3E9DA',
      primary: '#5A7A12',
      primaryInk: '#FBFDF0',
      accents: [
        '#B77A12',
        '#8DA432',
        '#D9CF6A'
      ]
    }
  },
  {
    id: 'tinta',
    name: 'Tinta',
    description: 'Tinta negra sobre papel blanco.',
    light: {
      bg: '#F5F5F3',
      surface: '#FFFFFF',
      border: '#DEDED9',
      text: '#1A1A1A',
      primary: '#1C1C1C',
      primaryInk: '#FFFFFF',
      accents: [
        '#3A3A3A',
        '#8A8A8A',
        '#4A4A4A'
      ]
    },
    dark: {
      bg: '#0E0E0E',
      surface: '#181818',
      border: '#2F2F2F',
      text: '#F2F2F2',
      primary: '#F2F2F2',
      primaryInk: '#111111',
      accents: [
        '#E6E6E6',
        '#8A8A8A',
        '#BDBDBD'
      ]
    }
  },
  {
    id: 'aurora',
    name: 'Aurora boreal',
    description: 'Verde menta y turquesa sobre un cielo violeta.',
    light: {
      bg: '#F1F4F6',
      surface: '#FBFDFE',
      border: '#D8E1E8',
      text: '#2B211B',
      primary: '#524094',
      primaryInk: '#FBF9FF',
      accents: [
        '#01EFAC',
        '#2082A6',
        '#6B4AAE'
      ]
    },
    dark: {
      bg: '#0A1220',
      surface: '#111B2C',
      border: '#243349',
      text: '#F3E9DA',
      primary: '#6A56B8',
      primaryInk: '#FAF8FF',
      accents: [
        '#01EFAC',
        '#2082A6',
        '#7A5AB8'
      ]
    }
  },
  {
    id: 'dracula',
    name: 'Drácula',
    description: 'Rojo sangre, borgoña y negro de noche.',
    light: {
      bg: '#F4EFE8',
      surface: '#FBF8F3',
      border: '#E0D4C8',
      text: '#1E0E0E',
      primary: '#72090F',
      primaryInk: '#FFF6F2',
      accents: [
        '#B21F29',
        '#930510',
        '#53080E'
      ]
    },
    dark: {
      bg: '#050202',
      surface: '#140809',
      border: '#2E1416',
      text: '#F3E9DA',
      primary: '#9E1B24',
      primaryInk: '#FFF3F0',
      accents: [
        '#C8283A',
        '#930510',
        '#53080E'
      ]
    }
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    description: 'Ceniza, carbón y cuero antiguo.',
    light: {
      bg: '#EDEBE7',
      surface: '#F8F7F4',
      border: '#D6D2CB',
      text: '#1C1A18',
      primary: '#371E1E',
      primaryInk: '#F5F1EC',
      accents: [
        '#6E3A36',
        '#726E68',
        '#B7B4AE'
      ]
    },
    dark: {
      bg: '#0A0A0A',
      surface: '#151414',
      border: '#2E2B29',
      text: '#E8E4DE',
      primary: '#5A3431',
      primaryInk: '#F5EEEA',
      accents: [
        '#7A4540',
        '#726E68',
        '#B7B4AE'
      ]
    }
  },
  {
    id: 'algodon',
    name: 'Algodón de azúcar',
    description: 'Rosa, lila y celeste pastel.',
    light: {
      bg: '#FFF6FB',
      surface: '#FFFFFF',
      border: '#F1DDEA',
      text: '#2B211B',
      primary: '#B8327F',
      primaryInk: '#FFFFFF',
      accents: [
        '#FE98D6',
        '#B8BAFD',
        '#AEDDFA'
      ]
    },
    dark: {
      bg: '#141A2B',
      surface: '#1B2236',
      border: '#313A56',
      text: '#F3E9DA',
      primary: '#F8A8E8',
      primaryInk: '#2A1430',
      accents: [
        '#FE98D6',
        '#B8BAFD',
        '#AEDDFA'
      ]
    }
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    description: 'Lavanda, lila y malva sobre crema.',
    light: {
      bg: '#F3EFE6',
      surface: '#FBF9F4',
      border: '#E0DBD4',
      text: '#2B211B',
      primary: '#5A4D7A',
      primaryInk: '#FBF8FF',
      accents: [
        '#B8A4D4',
        '#C8B3C8',
        '#9A93AC'
      ]
    },
    dark: {
      bg: '#16131C',
      surface: '#201C28',
      border: '#383143',
      text: '#F3E9DA',
      primary: '#7A6B9E',
      primaryInk: '#FBF8FF',
      accents: [
        '#B8A4D4',
        '#C8B3C8',
        '#DCD9E1'
      ]
    }
  },
  {
    id: 'girasol',
    name: 'Girasol',
    description: 'Amarillo, mango y caléndula con centro café.',
    light: {
      bg: '#FBF6E0',
      surface: '#FFFDF4',
      border: '#EDE1B8',
      text: '#2B211B',
      primary: '#7F2F01',
      primaryInk: '#FFF9E8',
      accents: [
        '#FEDC01',
        '#FDB500',
        '#ED8001'
      ]
    },
    dark: {
      bg: '#170F06',
      surface: '#22170A',
      border: '#3C2A14',
      text: '#F3E9DA',
      primary: '#A8480A',
      primaryInk: '#FFF8EC',
      accents: [
        '#FEDC01',
        '#FDB500',
        '#ED8001'
      ]
    }
  }
]

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && palettes.some((p) => p.id === value)
}

export function getPalette(id: PaletteId): Palette {
  return palettes.find((p) => p.id === id) ?? palettes[0]
}
