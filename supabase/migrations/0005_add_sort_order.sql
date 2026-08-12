alter table books add column estante_sort_order double precision;
alter table books add column saga_sort_order double precision;
alter table sagas add column estante_sort_order double precision;

-- inicializa el orden existente usando la fecha de creación como punto de partida
update books set estante_sort_order = extract(epoch from created_at) where estante_sort_order is null;
update books set saga_sort_order = extract(epoch from created_at) where saga_sort_order is null and saga_id is not null;
update sagas set estante_sort_order = extract(epoch from created_at) where estante_sort_order is null;