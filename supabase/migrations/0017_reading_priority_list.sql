-- "Lista de esta temporada": una capa de prioridad sobre los libros "pendiente", no un
-- estado nuevo. Un libro marcado como prioridad sigue siendo "pendiente" en todo lo demás
-- (mismos filtros, mismas estadísticas) — solo se le da un lugar aparte y ordenable en Mesa.
--
-- `is_priority` se limpia SOLO cuando el libro deja de estar "pendiente" (empieza a leerse,
-- se abandona, se marca deseado o terminado), para que la lista nunca se llene de libros que
-- ya no están "por leer". `priority_sort_order` sigue el mismo patrón que
-- `estante_sort_order`/`saga_sort_order` (0005_add_sort_order.sql), para poder reordenar la
-- lista arrastrando con el mismo mecanismo (`computeMidpointOrder`) ya usado en Estante.

alter table books add column is_priority boolean not null default false;
alter table books add column priority_sort_order double precision;

create or replace function sync_book_is_priority()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from 'pendiente' and new.is_priority then
    new.is_priority := false;
  end if;
  return new;
end;
$$;

create trigger trg_sync_book_is_priority
  before insert or update on books
  for each row execute function sync_book_is_priority();
