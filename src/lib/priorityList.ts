// Nombre por defecto de la lista de prioridad de pendientes cuando la persona no puso uno propio
// (`profiles.priority_list_name`). V.3.3.0: "Mis próximas lecturas" reemplaza a "Mi lista de
// esta temporada", que no decía qué era. Quien había puesto un nombre propio lo conserva.
// Centralizado acá para que Perfil, Estante y "¿Qué leo ahora?" muestren siempre el mismo texto.
export const DEFAULT_PRIORITY_LIST_NAME = 'Mis próximas lecturas'

export function getPriorityListName(name: string | null | undefined): string {
  return name?.trim() || DEFAULT_PRIORITY_LIST_NAME
}
