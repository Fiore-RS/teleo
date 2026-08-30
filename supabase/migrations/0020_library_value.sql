-- Bitácora: sección "Valor de tu biblioteca". Precio y fecha de compra van en `books`
-- (no en una tabla aparte) porque son un atributo más del libro, igual que total_pages o
-- format, y así cualquier query existente que ya trae `books` puede sumarlos sin joins nuevos.
--
-- Ambos campos son opcionales y sin valor por defecto a propósito: Fiorella tiene 382 libros
-- ya cargados y no quiere forzarse a rellenar el precio/fecha de compra de todos de golpe.
-- Un libro sin `price` simplemente no participa en los totales de valor de biblioteca; un
-- libro con `price` pero sin `purchase_date` sí suma al total invertido y al promedio, pero
-- queda fuera de la gráfica de "gasto por mes/año" (pensada para compras nuevas de aquí en
-- adelante, no para reconstruir el historial de libros que ya estaban en el estante).
alter table books add column price numeric(10, 2);
alter table books add column purchase_date date;

-- Moneda de la cuenta (no por libro): selector en Configuración con catálogo ISO 4217
-- completo. Nula hasta que la usuaria la elija — el formateo en la app cae a un valor por
-- defecto razonable mientras tanto, en vez de forzar una elección en el primer login.
alter table profiles add column currency text;

-- Nota importante de privacidad: `get_public_profile_extras()` (0008_public_profile_stats.sql)
-- NO se toca en esta migración a propósito. El valor de biblioteca es dato financiero y debe
-- quedar siempre fuera del perfil público, sin depender de un toggle que alguien pueda
-- olvidar activar/desactivar — a diferencia de show_stats/show_years_in_books/etc.
