-- Permite personalizar el nombre de "Mi lista de esta temporada" (Mesa). Es solo una
-- etiqueta de presentación: NULL (o vacío) significa "usar el nombre por defecto" — la lógica
-- de fallback vive en el cliente (Mesa.tsx/Estante.tsx), no acá, para no tener que sincronizar
-- el texto por defecto en dos lugares si algún día cambia.

alter table profiles add column priority_list_name text;
