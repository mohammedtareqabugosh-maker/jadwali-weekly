import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { calculatePeriodStats, getStreak } from './stats'
import { createSeedData } from '../data/seed'
import { completionKey } from './time'

const task = (id: string, type: Task['type'], start: string, end: string): Task => ({ id, title: id, type, day: 1, start, end, notes: '', fixed: false, allowSplit: false, countsTowardsProgress: type !== 'rest' && type !== 'sleep' })

describe('الإحصائيات وسلسلة الالتزام', () => {
  it('لا تضاعف المحاضرة داخل العمل في الوقت المشغول', () => {
    const monday = new Date(2026, 9, 26, 12)
    const stats = calculatePeriodStats([task('work', 'work', '09:00', '19:00'), task('online', 'online', '11:00', '12:00')], {}, [monday])
    expect(stats.occupiedMinutes).toBe(600)
    expect(stats.categoryMinutes.online.planned).toBe(60)
  })
  it('تستبعد الراحة من نسبة الإنجاز وتتعامل مع اليوم الفارغ', () => {
    const monday = new Date(2026, 9, 26, 12)
    const stats = calculatePeriodStats([task('rest', 'rest', '12:00', '13:00')], {}, [monday])
    expect(stats.total).toBe(0)
    expect(stats.percentage).toBe(0)
    expect(getStreak(createSeedData(), monday)).toEqual({ current: 0, best: 0 })
  })
  it('تحتسب الإنجاز من سجل التاريخ المحلي', () => {
    const monday = new Date(2026, 9, 26, 12)
    const work = task('work', 'work', '09:00', '10:00')
    const stats = calculatePeriodStats([work], { [completionKey(monday, work.id)]: true }, [monday])
    expect(stats.percentage).toBe(100)
    expect(stats.completedMinutes).toBe(60)
  })
})
