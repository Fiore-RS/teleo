-- V.3.1.0 "Conocer mejor lo que lees".
--
-- 1. Rasgos de cada libro: género (hasta 3), ánimo (hasta 3) y ritmo (uno). Se guardan claves
--    fijas en inglés; el texto en español sale de src/lib/bookTraits.ts (así Teleo en inglés
--    solo traduce las etiquetas). Las listas de valores permitidos coinciden con ese archivo.
--    genres_source: de dónde vino el género ('suggested' = sugerencia automática, 'manual' = lo
--    puso la persona). La sugerencia nunca sobrescribe un género 'manual'.
--    custom_moods: ánimos que escribe la persona (texto libre, como las etiquetas), aparte de
--    los fijos para que los fijos se puedan traducir. Entre los dos, hasta 3 por libro.
--
-- 2. Estado "En pausa" (pausado) para libros y sagas, con la fecha de pausa, un motivo
--    opcional y los días en pausa acumulados (para que el ritmo y la fecha estimada de fin no
--    cuenten el tiempo en pausa). Al retomar, paused_days suma los días y se borran paused_at
--    y pause_reason.
--
-- 3. Orden de Cuaderno › Citas (cuaderno_sort_order), aparte de favorite_quotes.sort_order,
--    que es el orden dentro de cada reseña. Las citas existentes arrancan en el orden de
--    "Fecha agregada" (la más reciente arriba).

-- 1. Rasgos
alter table books
  add column genres text[] not null default '{}',
  add column moods text[] not null default '{}',
  add column custom_moods text[] not null default '{}',
  add column pace text,
  add column genres_source text;

alter table books
  add constraint books_genres_valid check (
    cardinality(genres) <= 3
    and genres <@ array[
      'fantasy','romance','scifi','mystery','thriller','horror','historical','contemporary',
      'young_adult','classics','poetry','nonfiction','bl','gl'
    ]::text[]
  ),
  add constraint books_moods_valid check (
    cardinality(moods) <= 3
    and moods <@ array[
      'adventurous','funny','emotional','hopeful','inspiring','mysterious','dark','reflective',
      'relaxing','romantic','tense','sad'
    ]::text[]
  ),
  add constraint books_custom_moods_valid check (
    cardinality(moods) + cardinality(custom_moods) <= 3
  ),
  add constraint books_pace_valid check (pace is null or pace in ('fast','medium','slow')),
  add constraint books_genres_source_valid check (genres_source is null or genres_source in ('suggested','manual'));

-- 2. En pausa
alter table books drop constraint books_status_check;
alter table books add constraint books_status_check
  check (status in ('leyendo','pendiente','terminado','abandonado','deseado','pausado'));

alter table sagas drop constraint sagas_status_check;
alter table sagas add constraint sagas_status_check
  check (status in ('leyendo','pendiente','terminado','abandonado','deseado','pausado'));

alter table books
  add column paused_at date,
  add column pause_reason text,
  add column paused_days integer not null default 0;

alter table books
  add constraint books_paused_days_valid check (paused_days >= 0);

-- 3. Orden de Citas
alter table favorite_quotes add column cuaderno_sort_order double precision;

-- Más reciente arriba (orden ascendente): el número más chico es la más nueva.
update favorite_quotes set cuaderno_sort_order = -extract(epoch from created_at)
  where cuaderno_sort_order is null;
