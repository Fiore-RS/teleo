-- Vista del estante (V.3.0.0): cada cuenta elige cómo se ven sus libros y sagas en Estante.
-- Una sola vista para las dos pestañas. Los valores por defecto son los de la 3.0.0:
-- repisas de 3, con título y autor.
--
-- Los valores coinciden con src/lib/shelfView.ts.

alter table profiles
  add column shelf_columns smallint not null default 3,
  add column shelf_show_names boolean not null default true,
  add column shelf_planks boolean not null default true;

alter table profiles
  add constraint profiles_shelf_columns_valid check (shelf_columns in (3, 4));
