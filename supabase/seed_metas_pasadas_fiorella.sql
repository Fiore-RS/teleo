-- Metas de lectura de años anteriores (datos personales de Fiorella), agregadas a mano porque
-- la app por ahora solo deja editar la meta del año EN CURSO desde "Editar Meta" en Mesa —
-- no hay ninguna pantalla para cargar la meta de un año pasado.
--
-- Requisito: correr esto DESPUÉS de aplicar la migración 0014_reading_goals.sql (necesita que
-- la tabla `reading_goals` ya exista). Se puede pegar directo en el SQL Editor de Supabase.

insert into reading_goals (user_id, year, goal)
select id, 2024, 1 from auth.users where email = 'fiorellars0506@gmail.com'
union all
select id, 2025, 25 from auth.users where email = 'fiorellars0506@gmail.com'
on conflict (user_id, year) do update set goal = excluded.goal;
