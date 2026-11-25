-- Formato por lectura (V.4.6.0).
--
-- Hasta ahora el formato era del libro: si alguien tenía un libro en físico y después lo
-- escuchaba en audiolibro, tenía que registrarlo dos veces y no contaba como relectura
-- (decidido por Fiorella, 24 nov 2026). Desde ahora el formato se elige al empezar cada
-- lectura, junto con la fecha de inicio, y cada fila del historial guarda con qué formato se
-- hizo esa lectura. El libro guarda solo sus datos (páginas y duración del audiolibro, las
-- dos opcionales).
--
-- `books.format` se queda, pero ahora dice el formato de la lectura en curso (o de la última).
-- Las estadísticas por formato salen de `reading_history.format`, así que cambiar el formato
-- de la lectura actual ya no cambia las lecturas viejas.

alter table reading_history
  add column format text check (format in ('fisico','digital','audiolibro'));

-- Las lecturas que ya existen toman el formato que tiene hoy su libro (el único que había).
update reading_history rh
set format = b.format
from books b
where b.id = rh.book_id
  and rh.format is null;
