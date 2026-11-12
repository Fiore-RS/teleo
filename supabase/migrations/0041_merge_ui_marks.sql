-- Marcas de la app en la cuenta (V.3.7.2): juntar en vez de reemplazar.
--
-- profiles.ui_marks (0040) guarda varias marcas en un solo jsonb. Si la app lo reemplazara
-- entero, un dispositivo con datos viejos podría borrar lo que marcó otro (por ejemplo, el
-- celular abierto desde hace días pisa la postal que se vio en la computadora). Esta función
-- junta el cambio con lo que ya está guardado, en dos niveles:
--   - Si la clave es un objeto en los dos lados (metaCelebrada, anuncioResumen, sortModes),
--     se juntan sus claves: { "2025": … } + { "2026": … } = los dos años.
--   - Si no (loTengoOfrecido, completeShelfSkipped), gana lo que llega.
-- Solo cambia el perfil de quien la llama, y nunca el de la cuenta de visitante.

create or replace function public.merge_ui_marks(patch jsonb)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  update profiles p
  set ui_marks = (
    select coalesce(jsonb_object_agg(keys.k,
      case
        when jsonb_typeof(p.ui_marks -> keys.k) = 'object' and jsonb_typeof(patch -> keys.k) = 'object'
          then (p.ui_marks -> keys.k) || (patch -> keys.k)
        when patch ? keys.k then patch -> keys.k
        else p.ui_marks -> keys.k
      end), '{}'::jsonb)
    from (
      select jsonb_object_keys(p.ui_marks) as k
      union
      select jsonb_object_keys(patch)
    ) as keys
  )
  where p.id = auth.uid() and not p.is_demo
  returning p.ui_marks;
$$;

grant execute on function public.merge_ui_marks(jsonb) to authenticated;
