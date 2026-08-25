// Nombre por defecto de "Mi lista de esta temporada" (Mesa) cuando el usuario no personalizó
// uno propio (`profiles.priority_list_name`). Centralizado acá para que Mesa.tsx y
// Estante.tsx muestren siempre el mismo texto sin duplicarlo.
export const DEFAULT_PRIORITY_LIST_NAME = 'Mi lista de esta temporada'

export function getPriorityListName(name: string | null | undefined): string {
  return name?.trim() || DEFAULT_PRIORITY_LIST_NAME
}
