-- Menos temas de color (V.2.1.0): se quitan Océano, Tinta, Drácula y Lavanda porque se
-- parecían demasiado a otros. Quien tenía uno de esos vuelve a Atardecer.
--
-- Los valores permitidos coinciden con src/lib/palettes.ts.

update profiles
  set palette = 'atardecer'
  where palette in ('oceano', 'tinta', 'dracula', 'lavanda');

alter table profiles
  drop constraint profiles_palette_valid,
  add constraint profiles_palette_valid check (palette in (
    'atardecer', 'bosque', 'aurora', 'biblioteca', 'algodon', 'girasol'
  ));
