-- Permite anotar la cantidad total de libros planeados para una saga,
-- para poder mostrar el progreso (ej. "2 de 5 libros").
alter table sagas add column total_books int;
