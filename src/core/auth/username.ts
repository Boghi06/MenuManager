/**
 * Login con nome utente su Supabase Auth (che accetta solo email):
 * il nome utente viene convertito nell'email sintetica
 * `<nome>@utenti.local`, la stessa con cui l'account va creato a mano
 * nella dashboard Supabase (con "Auto Confirm User" attivo).
 *
 * Ogni cliente ha il proprio progetto Supabase, quindi il dominio fisso
 * non crea collisioni tra clienti.
 */
export const USERNAME_EMAIL_DOMAIN = 'utenti.local'

/**
 * Converte l'input del campo login nell'email per Supabase.
 * Se contiene già una `@` viene trattato come email completa
 * (retrocompatibilità con gli account storici creati con email vera).
 */
export function loginInputToEmail(input: string): string {
  const value = input.trim().toLowerCase()
  if (value.includes('@')) return value
  return `${value}@${USERNAME_EMAIL_DOMAIN}`
}

/**
 * Nome utente da mostrare, ricavato dall'email dell'account: la parte prima
 * della `@` (per gli account `<nome>@utenti.local` è il nome utente vero;
 * per gli account storici con email reale è comunque un'etichetta sensata).
 */
export function emailToUsername(email: string | null | undefined): string {
  if (!email) return ''
  return email.split('@')[0]
}
