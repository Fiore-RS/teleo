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

-- VISTA PREVIA A (solo lee)
-- A. Libros terminados con fecha de fin y sin ninguna lectura registrada
select b.user_id, b.title, b.start_date, b.end_date
from books b
where b.status = 'terminado'
  and b.end_date is not null
  and not exists (select 1 from reading_history h where h.book_id = b.id)
order by b.user_id, b.end_date;
