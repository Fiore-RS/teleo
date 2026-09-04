-- Restaura la racha de lectura de Fiorella: olvidó marcar el día 2026-09-03 (ayer).
-- Script de datos puntual (no es una migración de esquema) — correr una sola vez
-- manualmente en el SQL Editor de Supabase.

insert into reading_sessions (user_id, session_date)
select id, '2026-09-03'::date
from auth.users
where email = 'fiorellars0506@gmail.com'
on conflict (user_id, session_date) do nothing;
