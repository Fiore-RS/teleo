-- Las sagas creadas desde AddSagaModal nunca seteaban estante_sort_order al insertarse,
-- así que quedaban en NULL. Eso rompe el cálculo de punto medio al reordenar en Estante
-- (drag and drop): con varias sagas en NULL (tratadas todas como 0 al ordenar), mover una
-- entre otras dos con NULL siempre da 0 y no cambia el orden relativo, por lo que el
-- arrastre "no deja colocar los elementos libremente". Este backfill le da a esas sagas
-- un valor inicial (igual criterio que el backfill original de 0005_add_sort_order.sql),
-- y el código de AddSagaModal ya se corrigió para que las sagas nuevas siempre traigan
-- su estante_sort_order desde la creación.
update sagas set estante_sort_order = extract(epoch from created_at) where estante_sort_order is null;
