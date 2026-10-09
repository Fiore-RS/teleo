import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

/** Cómo se ve el Estante (V.3.0.0). Se guarda en la cuenta (profiles.shelf_*) y vale para
 *  Libros y Sagas. "3 columnas, con nombres, sin repisa" es la cuadrícula de antes. */
export interface ShelfView {
  columns: 3 | 4
  showNames: boolean
  planks: boolean
}

export const DEFAULT_SHELF_VIEW: ShelfView = { columns: 3, showNames: true, planks: true }

export function shelfViewFromProfile(profile: Profile | null | undefined): ShelfView {
  if (!profile) return DEFAULT_SHELF_VIEW
  return {
    columns: profile.shelf_columns === 4 ? 4 : 3,
    showNames: profile.shelf_show_names ?? true,
    planks: profile.shelf_planks ?? true,
  }
}

export function shelfViewToProfile(view: ShelfView): Pick<Profile, 'shelf_columns' | 'shelf_show_names' | 'shelf_planks'> {
  return { shelf_columns: view.columns, shelf_show_names: view.showNames, shelf_planks: view.planks }
}
