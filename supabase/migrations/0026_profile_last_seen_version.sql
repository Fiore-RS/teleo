-- Anuncio de la V.2.0.0: la última versión de Teleo cuyas novedades vio esta cuenta.
-- Se guarda en el perfil (y no en el navegador) para que el anuncio no se repita al abrir
-- Teleo en otro celular. Nula = todavía no vio ningún anuncio. Las cuentas nuevas la llenan
-- al terminar la Bienvenida, así no les aparece un anuncio de cosas que para ellas no son nuevas.
alter table profiles add column last_seen_version text;
