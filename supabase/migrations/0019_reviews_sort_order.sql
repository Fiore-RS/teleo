-- Permite reordenar las reseñas en Cuaderno con drag-and-drop ("modo libre" del nuevo menú
-- de Organizar), igual que ya se puede en Estante con libros y sagas. Mismo patrón que
-- 0005_add_sort_order.sql: se inicializa con la fecha de creación como punto de partida.

alter table reviews add column sort_order double precision;

update reviews set sort_order = extract(epoch from created_at) where sort_order is null;
