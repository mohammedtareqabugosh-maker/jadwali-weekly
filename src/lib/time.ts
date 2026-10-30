import type { Task } from '../types'

export const MINUTES_PER_DAY = 1440

export function toMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return Number.NaN
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return Number.NaN
  return hours * 60 + minutes
}

export function fromMinutes(value: number): string {
  const normalized = ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

export function endMinutes(task: Pick<Task, 'start' | 'end'>): number {
  const start = toMinutes(task.start)
  const end = toMinutes(task.end)
  return end === 0 && start > 0 ? MINUTES_PER_DAY : end
}

export function durationMinutes(start: string, end: string): number {
  const startValue = toMinutes(start)
  const endValue = toMinutes(end)
  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return Number.NaN
  const normalizedEnd = endValue === 0 && startValue > 0 ? MINUTES_PER_DAY : endValue
  return normalizedEnd - startValue
}

export function validateTimes(start: string, end: string): string | null {
  const duration = durationMinutes(start, end)
  if (!Number.isFinite(duration)) return 'أدخل وقتًا صحيحًا بصيغة الساعة والدقائق.'
  if (duration <= 0) return 'يجب أن يكون وقت النهاية بعد وقت البداية. يمكن استخدام 00:00 لمنتصف الليل.'
  if (duration > MINUTES_PER_DAY) return 'لا يمكن أن تتجاوز مدة المهمة يومًا كاملًا.'
  return null
}

export function formatTime(value: string | number): string {
  const minutes = typeof value === 'string' ? toMinutes(value) : value
  if (!Number.isFinite(minutes)) return '—'
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hour24 = Math.floor(normalized / 60)
  const minute = normalized % 60
  const hour12 = hour24 % 12 || 12
  const suffix = hour24 === 0 && minute === 0 ? 'منتصف الليل' : hour24 === 12 && minute === 0 ? 'ظهرًا' : hour24 < 12 ? 'ص' : 'م'
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} د`
  if (!rest) return `${hours} س`
  return `${hours} س ${rest} د`
}

export function sortTasks<T extends Pick<Task, 'start' | 'end'>>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || endMinutes(a) - endMinutes(b))
}

export function tasksOverlap(a: Pick<Task, 'start' | 'end'>, b: Pick<Task, 'start' | 'end'>): boolean {
  const aStart = toMinutes(a.start)
  const bStart = toMinutes(b.start)
  return aStart < endMinutes(b) && bStart < endMinutes(a)
}

export function findConflicts(tasks: Task[], candidate: Task, ignoreId?: string): Task[] {
  return tasks.filter((task) => task.day === candidate.day && task.id !== (ignoreId ?? candidate.id) && tasksOverlap(task, candidate))
}

export function mergeBusyIntervals(tasks: Pick<Task, 'start' | 'end'>[], from = 0, to = MINUTES_PER_DAY): Array<[number, number]> {
  const intervals = tasks
    .map((task) => [Math.max(from, toMinutes(task.start)), Math.min(to, endMinutes(task))] as [number, number])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const interval of intervals) {
    const last = merged.at(-1)
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1])
    else merged.push([...interval])
  }
  return merged
}

export function findAvailableGaps(tasks: Task[], day: number, from = 0, to = MINUTES_PER_DAY): Array<[number, number]> {
  const busy = mergeBusyIntervals(tasks.filter((task) => task.day === day), from, to)
  const gaps: Array<[number, number]> = []
  let cursor = from
  for (const [start, end] of busy) {
    if (start > cursor) gaps.push([cursor, start])
    cursor = Math.max(cursor, end)
  }
  if (cursor < to) gaps.push([cursor, to])
  return gaps
}

export function findSlotForDuration(tasks: Task[], day: number, duration: number, from = 0): [number, number] | null {
  const gap = findAvailableGaps(tasks, day, from).find(([start, end]) => end - start >= duration)
  return gap ? [gap[0], gap[0] + duration] : null
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function startOfWeek(date: Date): Date {
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12), -date.getDay())
}

export function weekDates(anchor: Date): Date[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function completionKey(date: Date | string, taskId: string): string {
  return `${typeof date === 'string' ? date : dateKey(date)}:${taskId}`
}

export function isCompleted(completions: Record<string, boolean>, date: Date | string, taskId: string): boolean {
  return completions[completionKey(date, taskId)] === true
}

export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-JO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-JO', { day: 'numeric', month: 'short' }).format(date)
}

export function nowMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function getCurrentAndNext(tasks: Task[], day: number, now: number): { current?: Task; next?: Task } {
  const sorted = sortTasks(tasks.filter((task) => task.day === day))
  return {
    current: sorted.find((task) => toMinutes(task.start) <= now && now < endMinutes(task)),
    next: sorted.find((task) => toMinutes(task.start) > now),
  }
}
