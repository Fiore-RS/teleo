/** Temas de color de Teleo (V.2.1.0). Los colores completos de cada tema viven en
 *  index.css (bloques [data-palette]); aquí solo está lo que necesita la app para mostrar
 *  la lista: nombre, descripción y una muestra de colores para la vista previa.
 *  Los ids también están en la restricción de la columna profiles.palette (0030; Arrecife y
 *  Ciruela, V.3.6.0, en la 0038). */

export type PaletteId =
  | 'atardecer'
  | 'aurora'
  | 'biblioteca'
  | 'algodon'
  | 'bosque'
  | 'margarita'
  | 'arrecife'
  | 'ciruela'

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
    id: 'aurora',
    name: 'Aurora boreal',
    description: 'Cielo de noche con luces menta, azul y rosa.',
    light: {
      bg: '#F1F4F6',
      surface: '#FBFDFE',
      border: '#D8E1E8',
      text: '#2B211B',
      primary: '#524094',
      primaryInk: '#FBF9FF',
      accents: [
        '#00B784',
        '#2082A6',
        '#C2419A'
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
        '#1FE0A8',
        '#4FB0D4',
        '#E06CBD'
      ]
    }
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    description: 'Cuero oxblood, tinta azul, lacre y ciruela.',
    light: {
      bg: '#EDEBE7',
      surface: '#F8F7F4',
      border: '#D6D2CB',
      text: '#1C1A18',
      primary: '#371E1E',
      primaryInk: '#F5F1EC',
      accents: [
        '#3D5A86',
        '#A8434A',
        '#76507A'
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
        '#7E9CCB',
        '#D9767C',
        '#B48CB8'
      ]
    }
  },
  {
    id: 'algodon',
    name: 'Algodón de azúcar',
    description: 'Rosa chicle y celeste, con un toque de lila.',
    light: {
      bg: '#FFF4FA',
      surface: '#FFFFFF',
      border: '#F2D6E6',
      text: '#2A1F33',
      primary: '#C2317F',
      primaryInk: '#FFFFFF',
      accents: [
        '#3FA7E6',
        '#EE5FAE',
        '#8E7FE6'
      ]
    },
    dark: {
      bg: '#151A2E',
      surface: '#1D2239',
      border: '#353C5E',
      text: '#F4ECF7',
      primary: '#FF94D4',
      primaryInk: '#2A1030',
      accents: [
        '#6CC6F6',
        '#FF8CC8',
        '#B3A6F7'
      ]
    }
  },
  {
    id: 'bosque',
    name: 'Bosque',
    description: 'Hojas verdes, ámbar y frutos rojos.',
    light: {
      bg: '#F6F3E6',
      surface: '#FFFDF5',
      border: '#E4DECA',
      text: '#2B211B',
      primary: '#365004',
      primaryInk: '#FAFCEF',
      accents: [
        '#C27A0E',
        '#B0415A',
        '#6F9A24'
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
        '#DB9A2E',
        '#D0647C',
        '#94BE45'
      ]
    }
  },
  {
    id: 'margarita',
    name: 'Margarita',
    description: 'Margaritas sobre cielo celeste: amarillo, blanco y azul claro.',
    light: {
      bg: '#EAF4F7',
      surface: '#FBFBFA',
      border: '#D3E3E9',
      text: '#1B2E36',
      primary: '#F4B600',
      primaryInk: '#2A2104',
      accents: [
        '#94CFDC',
        '#EE8E1A',
        '#6FA84A'
      ]
    },
    dark: {
      bg: '#0F1A1F',
      surface: '#16242B',
      border: '#2A3F48',
      text: '#EEF3F4',
      primary: '#F4B600',
      primaryInk: '#1C1600',
      accents: [
        '#94CFDC',
        '#F5A445',
        '#8DC468'
      ]
    }
  },
  {
    id: 'arrecife',
    name: 'Arrecife',
    description: 'Turquesa y coral sobre arena rosada.',
    light: {
      bg: '#FFEEF1',
      surface: '#FFF9FA',
      border: '#F3D0D8',
      text: '#10302E',
      primary: '#0F7F79',
      primaryInk: '#FFFAF7',
      accents: [
        '#EC7A95',
        '#20B2AA',
        '#F08A6E'
      ]
    },
    dark: {
      bg: '#0A201E',
      surface: '#102C29',
      border: '#21453F',
      text: '#FDEFEA',
      primary: '#20B2AA',
      primaryInk: '#0C1A19',
      accents: [
        '#F7A1B4',
        '#5FD3CB',
        '#F5A18A'
      ]
    }
  },
  {
    id: 'ciruela',
    name: 'Ciruela',
    description: 'Ciruela profunda con pervinca y durazno.',
    light: {
      bg: '#EDEFF8',
      surface: '#F9FAFE',
      border: '#D5DAEC',
      text: '#2B0A17',
      primary: '#470B24',
      primaryInk: '#FFF4E6',
      accents: [
        '#EFA765',
        '#7E88C4',
        '#C2477F'
      ]
    },
    dark: {
      bg: '#1A0F1E',
      surface: '#241729',
      border: '#3E2B45',
      text: '#FBEDE3',
      primary: '#B5BEDD',
      primaryInk: '#1A0F1E',
      accents: [
        '#F2B279',
        '#A9B3E0',
        '#E07AA8'
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

/** Cuánto se suben las opacidades de los dibujos de banners y de la tarjeta de cita (V.3.6.0).
 *  Va de la mano con --teleo-banner-ink en index.css: en Margarita (claro y oscuro) y en
 *  Algodón de azúcar oscuro (y en Arrecife y Ciruela oscuros) los dibujos pasaron de oscuros a blanco, y sobre esos degradados
 *  claros el blanco con las opacidades de siempre se veía tenue. */
export function bannerArtBoost(palette: PaletteId, mode: 'light' | 'dark'): number {
  if (palette === 'margarita') return 1.7
  if (palette === 'algodon' && mode === 'dark') return 1.7
  // Arrecife y Ciruela (V.3.6.0): en oscuro el principal es claro y su texto oscuro.
  if ((palette === 'arrecife' || palette === 'ciruela') && mode === 'dark') return 1.7
  return 1
}
