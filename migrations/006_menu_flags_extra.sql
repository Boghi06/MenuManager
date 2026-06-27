-- ============================================================
-- 006 · Aggiunge flag extra a menu_flags
-- Run AFTER 005_menu_flags.sql
-- ============================================================
alter table public.menu_flags
  add column if not exists show_insalate      boolean not null default true,
  add column if not exists show_formaggi      boolean not null default true,
  add column if not exists show_buffet_dessert boolean not null default true;
