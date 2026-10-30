-- V.3.4.0: género y ánimo por saga.
--
-- 1. La saga guarda su propio género (hasta 3) y ánimo (fijos y propios, hasta 3 entre los
--    dos), con las mismas claves y reglas que los libros (0034). El ritmo queda solo por libro.
--
-- 2. Los datos de la saga se copian a cada libro (no se leen en vivo), así filtros,
--    estadísticas, "¿Qué leo ahora?" y el resumen siguen leyendo books sin cambios. Para saber
--    qué libros siguen a la saga:
--    - genres_source suma 'saga' (además de 'suggested' y 'manual').
--    - moods_source es nuevo: 'manual' (lo puso la persona) o 'saga'; vacío si no tiene ánimo.
--      Cubre moods y custom_moods juntos.
--    Las reglas para pasar los datos de la saga a sus libros están en src/lib/sagaTraits.ts.
--
-- 3. Los libros que ya tienen ánimo quedan como puestos a mano.

-- 1. Saga
alter table sagas
  add column genres text[] not null default '{}',
  add column moods text[] not null default '{}',
  add column custom_moods text[] not null default '{}';

alter table sagas
  add constraint sagas_genres_valid check (
    cardinality(genres) <= 3
    and genres <@ array[
      'fantasy','romance','scifi','mystery','thriller','horror','historical','contemporary',
      'young_adult','classics','poetry','nonfiction','bl','gl'
    ]::text[]
  ),
  add constraint sagas_moods_valid check (
    cardinality(moods) <= 3
    and moods <@ array[
      'adventurous','funny','emotional','hopeful','inspiring','mysterious','dark','reflective',
      'relaxing','romantic','tense','sad'
    ]::text[]
  ),
  add constraint sagas_custom_moods_valid check (
    cardinality(moods) + cardinality(custom_moods) <= 3
  );

-- 2. Libros
alter table books drop constraint books_genres_source_valid;
alter table books add constraint books_genres_source_valid
  check (genres_source is null or genres_source in ('suggested','manual','saga'));

alter table books add column moods_source text;
alter table books add constraint books_moods_source_valid
  check (moods_source is null or moods_source in ('manual','saga'));

-- 3. Ánimos que ya existen
update books set moods_source = 'manual'
  where cardinality(moods) + cardinality(custom_moods) > 0;
