-- Restaura la racha de lectura de 4 días de Fiorella, perdida por el bug donde el botón
-- "Marcar sesión de hoy" no se reiniciaba al cambiar de día (ver `useReadingStreak.ts`,
-- corregido en la app el 2026-08-25). Se pegan las 4 fechas consecutivas más recientes,
-- incluyendo hoy, tal como ella la tenía antes de perderla.
--
-- Se puede pegar directo en el SQL Editor de Supabase. `on conflict do nothing` evita error
-- si alguna de estas fechas ya tenía una sesión marcada (ej. hoy, si ya la había marcado).

insert into reading_sessions (user_id, session_date)
select id, d.session_date
from auth.users, unnest(array['2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25']::date[]) as d(session_date)
where auth.users.email = 'fiorellars0506@gmail.com'
on conflict (user_id, session_date) do nothing;
