import { db } from "./db"
import { apiClient } from "./api-client"

function baseUrl(change: { urlPath?: string; table: string; changeKey: string | number }): string {
  return change.urlPath ? `/${change.urlPath}` : `/${change.table}`
}

function dexieTable(name: string): string {
  return name
}

export async function enqueueChange(
  table: string,
  operation: "create" | "update" | "delete",
  data: Record<string, unknown>,
  changeKey: string | number,
  urlPath?: string,
): Promise<void> {
  if (!navigator.onLine) {
    await db.pendingChanges.add({
      table,
      urlPath,
      operation,
      data,
      changeKey,
      createdAt: new Date().toISOString(),
    })
  }
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0

  const pending = await db.pendingChanges.orderBy("createdAt").toArray()

  for (const change of pending) {
    try {
      switch (change.operation) {
        case "create": {
          const response = await apiClient.post(baseUrl(change), change.data) as { data: Record<string, unknown> }
          const serverRecord = response.data
          if (serverRecord && serverRecord.id) {
            const store = dexieTable(change.table)
            const localRecord = await (db as any)[store]?.get(change.changeKey)
            if (localRecord) {
              await (db as any)[store]?.delete(change.changeKey)
            }
            await (db as any)[store]?.put({ ...serverRecord })
          }
          break
        }
        case "update": {
          const response = await apiClient.put(`${baseUrl(change)}/${change.changeKey}`, change.data) as { data: Record<string, unknown> }
          const updated = response.data
          if (updated) {
            const store = dexieTable(change.table)
            await (db as any)[store]?.put({ ...updated })
          }
          break
        }
        case "delete":
          await apiClient.delete(`${baseUrl(change)}/${change.changeKey}`)
          await (db as any)[dexieTable(change.table)]?.delete(change.changeKey)
          break
      }
      await db.pendingChanges.delete(change.id!)
      synced++
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

export async function getPendingCount(): Promise<number> {
  return db.pendingChanges.count()
}
