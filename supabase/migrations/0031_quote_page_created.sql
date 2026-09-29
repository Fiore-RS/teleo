-- Mis citas (V.2.1.0). Cada cita puede guardar la página donde está (opcional) y la fecha en
-- que se agregó, para ordenar la colección de la más reciente a la más antigua. Las citas que
-- ya existían quedan con la fecha de esta migración.

alter table favorite_quotes
  add column page int
    constraint favorite_quotes_page_positive check (page is null or page > 0),
  add column created_at timestamptz not null default now();
