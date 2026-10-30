import type { AppData, MealLink, Nutrition, Task } from '../types'
import { createId } from './id'
import { dateKey, fromMinutes, toMinutes, validateTimes } from './time'

export interface MealImportResult {
  data: AppData
  action: 'imported' | 'updated'
  task: Task
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

export function importMeal(data: AppData, payload: unknown): MealImportResult {
  if (!payload || typeof payload !== 'object') throw new Error('بيانات الوجبة غير صالحة.')
  const wrapper = payload as Record<string, unknown>
  const raw = (wrapper.meal && typeof wrapper.meal === 'object' ? wrapper.meal : wrapper) as Record<string, unknown>
  const externalId = String(raw.externalId ?? raw.id ?? '').trim()
  const name = String(raw.name ?? raw.title ?? '').trim()
  if (!externalId || !name) throw new Error('يجب أن تتضمن الوجبة معرّفًا ثابتًا واسمًا.')
  const start = String(raw.start ?? raw.time ?? '')
  const end = String(raw.end ?? '')
  if (!Number.isFinite(toMinutes(start))) throw new Error('وقت الوجبة غير صالح.')
  const computedEnd = end || fromMinutes(toMinutes(start) + 60)
  if (validateTimes(start, computedEnd)) throw new Error('وقت نهاية الوجبة غير صالح.')
  let day = Number(raw.day)
  if (raw.date && !Number.isInteger(day)) {
    const parsed = new Date(`${String(raw.date)}T12:00:00`)
    if (!Number.isNaN(parsed.getTime())) day = parsed.getDay()
  }
  if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error('يجب تحديد يوم صحيح للوجبة من 0 إلى 6.')
  const rawNutrition = (raw.nutrition && typeof raw.nutrition === 'object' ? raw.nutrition : raw) as Record<string, unknown>
  const nutrition: Nutrition = {
    calories: optionalNumber(rawNutrition.calories),
    protein: optionalNumber(rawNutrition.protein),
    carbs: optionalNumber(rawNutrition.carbs),
    fat: optionalNumber(rawNutrition.fat),
  }
  const meal: MealLink = {
    externalId,
    name,
    kind: String(raw.kind ?? raw.type ?? 'وجبة'),
    date: typeof raw.date === 'string' ? raw.date : undefined,
    source: String(raw.source ?? 'مساعدي الغذائي'),
    url: typeof raw.url === 'string' && /^https?:\/\//.test(raw.url) ? raw.url : undefined,
    nutrition: Object.values(nutrition).some((value) => value !== undefined) ? nutrition : undefined,
  }
  const existing = data.tasks.find((task) => task.meal?.externalId === externalId)
  if (existing) {
    const updated: Task = { ...existing, title: name, day, start, end: computedEnd, type: 'meal', meal }
    return { data: { ...data, tasks: data.tasks.map((task) => task.id === existing.id ? updated : task), updatedAt: new Date().toISOString() }, action: 'updated', task: updated }
  }
  const task: Task = {
    id: createId('meal'),
    title: name,
    type: 'meal',
    day,
    start,
    end: computedEnd,
    notes: '',
    fixed: false,
    allowSplit: false,
    countsTowardsProgress: true,
    meal,
  }
  return { data: { ...data, tasks: [...data.tasks, task], updatedAt: new Date().toISOString() }, action: 'imported', task }
}

export function exportMeal(task: Task): void {
  if (!task.meal) return
  const payload = {
    schema: 'jadwali-meal-v1',
    exportedAt: new Date().toISOString(),
    meal: {
      ...task.meal,
      day: task.day,
      date: task.meal.date ?? dateKey(new Date()),
      start: task.start,
      end: task.end,
    },
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `meal-${task.meal.externalId}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
