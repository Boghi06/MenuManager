/** Azioni registrate dal trigger di audit (log_piatti_changes). */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

/**
 * Una riga dell'audit trail (public.activity_log). Popolata dai trigger su
 * piatti e menu_voci; leggibile via API solo dagli admin (migrazione 017).
 * old_data/new_data sono lo snapshot completo della riga prima/dopo.
 */
export interface ActivityLog {
  id: number
  created_at: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}
