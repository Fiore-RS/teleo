-- Corrección de datos de la fase 2.6 (fechas sin reseña obligatoria).
-- Correr UNA vez, el día del lanzamiento de la V.2.0.0, en Supabase → SQL Editor.
-- No es una migración a propósito: así `supabase db push` no la corre antes de tiempo.
--
-- Arregla dos errores que dejaban libros fuera del reto anual:
--   A. Libros agregados como terminados (o pasados a terminado desde Editar detalles) nunca
--      registraban su lectura en reading_history, así que no contaban.
--   B. Cambiar las fechas en la reseña actualizaba books.end_date pero no reading_history,
--      así que el reto seguía contando la fecha vieja (a veces en otro año).
-- Regla del reto: cuenta todo libro terminado con fecha de fin, en el año de esa fecha.
-- Libros terminados sin fecha de fin no se tocan: siguen sin contar.

-- ─── 1. VISTA PREVIA (solo lee, correr primero y revisar) ───────────────────────────────

-- A. Libros terminados con fecha de fin y sin ninguna lectura registrada
select b.user_id, b.title, b.start_date, b.end_date
from books b
where b.status = 'terminado'
  and b.end_date is not null
  and not exists (select 1 from reading_history h where h.book_id = b.id)
order by b.user_id, b.end_date;

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

-- ─── 2. CORRECCIÓN (todo o nada) ─────────────────────────────────────────────────────────

begin;

-- A. Registrar la lectura que faltaba
insert into reading_history (book_id, user_id, start_date, end_date)
select b.id, b.user_id, b.start_date, b.end_date
from books b
where b.status = 'terminado'
  and b.end_date is not null
  and not exists (select 1 from reading_history h where h.book_id = b.id);

-- B. Alinear la última lectura con las fechas del libro
with ultima as (
  select distinct on (book_id) id, book_id
  from reading_history
  order by book_id, end_date desc, created_at desc
)
update reading_history h
set start_date = b.start_date,
    end_date = b.end_date
from ultima u
join books b on b.id = u.book_id
where h.id = u.id
  and b.status = 'terminado'
  and b.end_date is not null
  and (h.end_date <> b.end_date or h.start_date is distinct from b.start_date);

commit;
