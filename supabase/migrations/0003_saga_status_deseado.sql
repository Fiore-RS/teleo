alter table sagas drop constraint sagas_status_check;
alter table sagas add constraint sagas_status_check
  check (status in ('leyendo', 'pendiente', 'terminado', 'abandonado', 'deseado'));