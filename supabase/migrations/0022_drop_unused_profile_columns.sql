-- Limpieza de columnas de `profiles` que quedaron sin uso:
--
-- Los 8 toggles show_* (show_annual_goal, show_daily_streak, show_stats,
-- show_years_in_books, show_currently_reading, show_favorites, show_recommended,
-- show_wishlist) controlaban qué datos veía un visitante en la página pública de perfil
-- (/@usuario), retirada en 0021_retire_public_profile.sql. Esa migración ya quitó las
-- políticas RLS que los usaban pero dejó las columnas a propósito, "por si se prefería
-- limpiarlas en una migración aparte" — esta es esa migración. Confirmado que ningún
-- archivo del código las lee ni las escribe.
--
-- `annual_goal` quedó sin uso desde 0014_reading_goals.sql, que lo reemplazó por la tabla
-- `reading_goals` (una fila por año, con historial). La migración 0014 ya migró los valores
-- existentes a `reading_goals` y dejó de leer/escribir esta columna, pero nunca la borró.
-- Confirmado que ningún archivo del código la lee ni la escribe.

alter table profiles
  drop column show_annual_goal,
  drop column show_daily_streak,
  drop column show_stats,
  drop column show_years_in_books,
  drop column show_currently_reading,
  drop column show_favorites,
  drop column show_recommended,
  drop column show_wishlist,
  drop column annual_goal;
