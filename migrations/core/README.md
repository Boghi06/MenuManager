# Migrazioni core

Migrazioni condivise tra tutti i moduli (auth, infrastruttura comune).
Attualmente vuota: la 004_security_hardening è rimasta sotto `modules/menu`
perché interviene su tabelle del dominio menu.

Le migrazioni vengono applicate da `scripts/apply-migrations.sh` in ordine:
prima `core/`, poi i moduli abilitati del cliente.
