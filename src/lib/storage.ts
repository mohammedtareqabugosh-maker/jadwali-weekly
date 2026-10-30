import { openDB, type IDBPDatabase } from 'idb'
import type { AppData } from '../types'
import { createSeedData } from '../data/seed'
import { validateBackup } from './validation'

const DB_NAME = 'jadwali-weekly'
const STORE_NAME = 'local-data'
const DATA_KEY = 'app-state'
let databasePromise: Promise<IDBPDatabase> | null = null

function getDatabase(): Promise<IDBPDatabase> {
  if (!databasePromise) {
    databasePromise = openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
      },
    })
  }
  return databasePromise
}

export async function loadData(): Promise<AppData> {
  try {
    const database = await getDatabase()
    const stored = await database.get(STORE_NAME, DATA_KEY)
    if (!stored) {
      const seed = createSeedData()
      await database.put(STORE_NAME, seed, DATA_KEY)
      return seed
    }
    return validateBackup(stored)
  } catch (error) {
    throw new Error(`تعذر قراءة البيانات المحلية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    const database = await getDatabase()
    await database.put(STORE_NAME, { ...data, updatedAt: new Date().toISOString() }, DATA_KEY)
    localStorage.setItem('jadwali-theme', data.settings.theme)
  } catch (error) {
    throw new Error(`تعذر حفظ البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
  }
}

export function downloadBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `jadwali-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function parseBackupFile(file: File): Promise<AppData> {
  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف أكبر من 10 ميغابايت.')
  let value: unknown
  try {
    value = JSON.parse(await file.text())
  } catch {
    throw new Error('تعذر قراءة JSON. اختر نسخة احتياطية صادرة من التطبيق.')
  }
  return validateBackup(value)
}
