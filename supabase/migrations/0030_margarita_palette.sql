-- Girasol se reemplaza por Margarita (V.2.1.0). Quien tenía Girasol pasa a Margarita.
--
-- Los valores permitidos coinciden con src/lib/palettes.ts.

alter table profiles drop constraint profiles_palette_valid;

update profiles
  set palette = 'margarita'
  where palette = 'girasol';

alter table profiles
  add constraint profiles_palette_valid check (palette in (
    'atardecer', 'bosque', 'aurora', 'biblioteca', 'algodon', 'margarita'
  ));
