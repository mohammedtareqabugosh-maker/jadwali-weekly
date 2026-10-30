import type { AppData, Task, TaskType } from '../types'
import { dateKey, durationMinutes, isCompleted, mergeBusyIntervals, addDays, parseDateKey } from './time'

export interface PeriodStats {
  total: number
  completed: number
  remaining: number
  percentage: number
  plannedMinutes: number
  completedMinutes: number
  occupiedMinutes: number
  categoryMinutes: Record<'work' | 'university' | 'online' | 'study', { planned: number; completed: number }>
  mealsTotal: number
  mealsCompleted: number
}

export function calculatePeriodStats(tasks: Task[], completions: Record<string, boolean>, dates: Date[]): PeriodStats {
  const eligible = tasks.filter((task) => task.countsTowardsProgress && dates.some((date) => date.getDay() === task.day))
  const instances = dates.flatMap((date) => tasks.filter((task) => task.day === date.getDay()).map((task) => ({ task, date })))
  const eligibleInstances = instances.filter(({ task }) => task.countsTowardsProgress)
  const completedInstances = eligibleInstances.filter(({ task, date }) => isCompleted(completions, date, task.id))
  const categoryMinutes = {
    work: { planned: 0, completed: 0 },
    university: { planned: 0, completed: 0 },
    online: { planned: 0, completed: 0 },
    study: { planned: 0, completed: 0 },
  }
  for (const { task, date } of instances) {
    if (task.type in categoryMinutes) {
      const key = task.type as keyof typeof categoryMinutes
      const duration = durationMinutes(task.start, task.end)
      categoryMinutes[key].planned += duration
      if (isCompleted(completions, date, task.id)) categoryMinutes[key].completed += duration
    }
  }
  const occupiedMinutes = dates.reduce((total, date) => {
    const dayTasks = tasks.filter((task) => task.day === date.getDay())
    const merged = mergeBusyIntervals(dayTasks)
    return total + merged.reduce((sum, [start, end]) => sum + end - start, 0)
  }, 0)
  const meals = instances.filter(({ task }) => task.type === 'meal')
  return {
    total: eligible.length,
    completed: completedInstances.length,
    remaining: eligibleInstances.length - completedInstances.length,
    percentage: eligibleInstances.length ? Math.round((completedInstances.length / eligibleInstances.length) * 100) : 0,
    plannedMinutes: eligibleInstances.reduce((sum, { task }) => sum + durationMinutes(task.start, task.end), 0),
    completedMinutes: completedInstances.reduce((sum, { task }) => sum + durationMinutes(task.start, task.end), 0),
    occupiedMinutes,
    categoryMinutes,
    mealsTotal: meals.length,
    mealsCompleted: meals.filter(({ task, date }) => isCompleted(completions, date, task.id)).length,
  }
}

export function getStreak(data: AppData, today = new Date()): { current: number; best: number } {
  const first = parseDateKey(dateKey(new Date(data.createdAt)))
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  let current = 0
  let best = 0
  let running = 0
  const dates: Array<{ date: Date; met: boolean }> = []
  for (let date = first; date <= last; date = addDays(date, 1)) {
    const stats = calculatePeriodStats(data.tasks, data.completions, [date])
    const met = stats.total > 0 && stats.percentage >= data.settings.streakTarget
    dates.push({ date, met })
    running = met ? running + 1 : 0
    best = Math.max(best, running)
  }
  const todayIsLast = dates.length && dateKey(dates.at(-1)!.date) === dateKey(today)
  const completedDates = todayIsLast ? dates.slice(0, -1) : dates
  for (let index = completedDates.length - 1; index >= 0; index -= 1) {
    if (!completedDates[index].met) break
    current += 1
  }
  if (todayIsLast && dates.at(-1)?.met) current += 1
  return { current, best }
}

export function plannedMinutesForType(tasks: Task[], type: TaskType): number {
  return tasks.filter((task) => task.type === type).reduce((sum, task) => sum + durationMinutes(task.start, task.end), 0)
}
