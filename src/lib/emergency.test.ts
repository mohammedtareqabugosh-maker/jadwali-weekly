import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { applyReplan, buildReplan } from './emergency'

const make = (id: string, start: string, end: string, fixed = false, type: Task['type'] = 'study'): Task => ({ id, title: id, type, day: 0, start, end, notes: '', fixed, allowSplit: true, countsTowardsProgress: type !== 'rest' })

describe('إعادة تنظيم اليوم', () => {
  it('يحافظ على الموعد الثابت ولا يغيره عند التطبيق', () => {
    const fixed = make('fixed', '10:00', '11:00', true, 'work')
    const flexible = make('flexible', '08:00', '08:30')
    const result = buildReplan([fixed, flexible], 0, [], 540)
    expect(result.proposals[0].newStart).not.toBe('10:00')
    const updated = applyReplan([fixed, flexible], result.proposals)
    expect(updated.find((task) => task.id === 'fixed')?.start).toBe('10:00')
    expect(updated.find((task) => task.id === 'flexible')?.start).toBe(result.proposals[0].newStart)
  })
  it('لا يضع مهمة داخل فترة الراحة', () => {
    const rest = make('rest', '09:00', '10:00', true, 'rest')
    const flexible = make('flexible', '08:00', '08:30')
    const result = buildReplan([rest, flexible], 0, [], 540)
    expect(result.proposals[0].newStart).toBe('10:00')
  })
  it('يستبعد المهمة المنجزة ويبلغ عند غياب الوقت', () => {
    const done = make('done', '08:00', '09:00')
    expect(buildReplan([done], 0, ['done'], 540).proposals).toHaveLength(0)
    const fixed = make('fixed', '09:00', '00:00', true, 'work')
    const result = buildReplan([fixed, done], 0, [], 540)
    expect(result.unscheduled.map((task) => task.id)).toContain('done')
  })
})
