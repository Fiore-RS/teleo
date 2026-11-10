-- "Lo tengo" (V.3.7.0): marca para los libros que la persona tiene en la vida real.
--
-- Es distinta del formato: "físico" dice cómo se leyó el libro, no si es de la persona (puede
-- ser prestado o de biblioteca). Empieza en false para todos; la app ofrece una sola vez marcar
-- los físicos que no están en Deseados.

alter table books
  add column owned boolean not null default false;
