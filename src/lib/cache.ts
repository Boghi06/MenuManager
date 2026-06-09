/**
 * Cache in-memory a livello di modulo, condivisa da tutti i componenti per
 * tutta la durata della sessione SPA (si azzera al refresh completo).
 *
 * Serve a implementare un pattern "stale-while-revalidate" negli hook:
 * al mount si mostrano subito i dati in cache (niente flash di caricamento)
 * e in background si rivalida con una fetch, aggiornando cache e stato.
 *
 * NB: è un cache di sessione, non una persistenza. Per dati che devono
 * sopravvivere al reload si userebbe localStorage/IndexedDB.
 */
const store = new Map<string, unknown>()

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function setCache<T>(key: string, value: T): void {
  store.set(key, value)
}

export function clearCache(key?: string): void {
  if (key) store.delete(key)
  else store.clear()
}
