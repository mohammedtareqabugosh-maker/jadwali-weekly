import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { durationMinutes, findAvailableGaps, findConflicts, findSlotForDuration, mergeBusyIntervals, validateTimes } from './time'

const task = (id: string, start: string, end: string, day = 0): Task => ({ id, title: id, type: 'study', day, start, end, notes: '', fixed: false, allowSplit: true, countsTowardsProgress: true })

describe('حساب الوقت والتعارضات', () => {
  it('يحسب 23:30 إلى منتصف الليل كـ30 دقيقة', () => {
    expect(durationMinutes('23:30', '00:00')).toBe(30)
    expect(validateTimes('23:30', '00:00')).toBeNull()
  })
  it('يرفض النهاية التي تسبق البداية', () => {
    expect(validateTimes('10:00', '09:00')).toBeTruthy()
    expect(durationMinutes('10:00', '09:00')).toBeLessThan(0)
  })
  it('يكتشف التداخل دون تعديل أي مهمة', () => {
    const first = task('first', '10:00', '11:00')
    const second = task('second', '10:30', '11:30')
    expect(findConflicts([first, second], first)).toEqual([second])
    expect(first.start).toBe('10:00')
    expect(second.start).toBe('10:30')
  })
  it('يدمج الفترات المتداخلة عند حساب الوقت المشغول', () => {
    const merged = mergeBusyIntervals([task('work', '09:00', '19:00'), task('online', '11:00', '12:00')])
    expect(merged).toEqual([[540, 1140]])
  })
})

describe('الفترات المتاحة', () => {
  it('يتسع لمهمة 30 دقيقة داخل فجوة 75 دقيقة', () => {
    const gaps = findAvailableGaps([], 0, 1365, 1440)
    expect(gaps[0][1] - gaps[0][0]).toBe(75)
    expect(findSlotForDuration([], 0, 30, 1365)).toEqual([1365, 1395])
  })
  it('لا يقترح مهمة 30 دقيقة داخل فجوة 20 دقيقة', () => {
    const tasks = [task('before', '00:00', '22:45'), task('after', '23:05', '23:59')]
    expect(findAvailableGaps(tasks, 0, 1365)[0][1] - findAvailableGaps(tasks, 0, 1365)[0][0]).toBe(20)
    expect(findSlotForDuration(tasks, 0, 30, 1365)).toBeNull()
  })
})
