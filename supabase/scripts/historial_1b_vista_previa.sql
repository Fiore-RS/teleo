-- Corrección de datos de la fase 2.6 (fechas sin reseña obligatoria), para el lanzamiento
-- de la V.2.0.0. No son migraciones a propósito, así `supabase db push` no las corre solo.
-- Se corren desde la terminal, en este orden:
--   npx supabase db query --linked -f supabase/scripts/historial_1a_vista_previa.sql
--   npx supabase db query --linked -f supabase/scripts/historial_1b_vista_previa.sql
--   (revisar juntas lo que salga)
--   npx supabase db query --linked -f supabase/scripts/historial_2_correccion.sql
--
-- Arregla dos errores que dejaban libros fuera del reto anual:
--   A. Libros agregados como terminados (o pasados a terminado desde Editar detalles) nunca
--      registraban su lectura en reading_history, así que no contaban.
--   B. Cambiar las fechas en la reseña actualizaba books.end_date pero no reading_history,
--      así que el reto seguía contando la fecha vieja (a veces en otro año).
-- Regla del reto: cuenta todo libro terminado con fecha de fin, en el año de esa fecha.
-- Libros terminados sin fecha de fin no se tocan: siguen sin contar.

-- VISTA PREVIA B (solo lee)
-- B. Última lectura registrada con fechas distintas a las del libro
with ultima as (
  select distinct on (book_id) id, book_id, start_date, end_date
  from reading_history
  order by book_id, end_date desc, created_at desc
)
select b.user_id, b.title,
       u.start_date as inicio_en_historial, b.start_date as inicio_en_libro,
       u.end_date as fin_en_historial, b.end_date as fin_en_libro
from ultima u
join books b on b.id = u.book_id
where b.status = 'terminado'
  and b.end_date is not null
  and (u.end_date <> b.end_date or u.start_date is distinct from b.start_date)
order by b.user_id, b.title;
