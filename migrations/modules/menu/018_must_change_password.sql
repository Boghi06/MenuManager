-- ============================================================
-- 018 · Cambio password obbligatorio al primo accesso
-- Run AFTER 016_user_roles.sql
--
-- Gli utenti creati dall'admin ricevono una password casuale iniziale e
-- devono cambiarla al primo login. Il flag vive su user_roles: default
-- false, così gli utenti esistenti (e il primo admin creato a mano) non
-- sono forzati; la serverless function api/create-user lo mette a true.
-- ============================================================

alter table public.user_roles
  add column if not exists must_change_password boolean not null default false;
