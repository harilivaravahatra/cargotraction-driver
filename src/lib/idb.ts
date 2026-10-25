import type { MissionEvent } from '../types'

const DB_NAME = 'cargotraction-driver'
const STORE = 'pending-events'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'client_event_id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function queueEvent(event: MissionEvent): Promise<void> {
  if (!('indexedDB' in window)) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(event)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listPendingEvents(): Promise<MissionEvent[]> {
  if (!('indexedDB' in window)) return []
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result as MissionEvent[])
    request.onerror = () => reject(request.error)
  })
}

export async function removeEvent(clientEventId: string): Promise<void> {
  if (!('indexedDB' in window)) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(clientEventId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function makeClientEventId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`
}
