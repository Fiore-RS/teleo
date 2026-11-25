-- Unidad del progreso (V.4.6.0).
--
-- Al actualizar el progreso, un libro digital se puede llevar en páginas o en porcentaje (hay
-- lectores que muestran la página) y un audiolibro en tiempo escuchado o en porcentaje
-- (decidido por Fiorella, 20 y 24 nov 2026). Se recuerda la última unidad elegida en cada
-- libro. Vacía = la de siempre según el formato: físico en páginas, digital en porcentaje y
-- audiolibro en tiempo.
--
-- Al guardar en una unidad, la app también llena las otras que se puedan calcular (con el
-- total de páginas o la duración), así cambiar de unidad no pierde el avance.

alter table books
  add column progress_unit text check (progress_unit in ('paginas', 'tiempo', 'porcentaje'));
