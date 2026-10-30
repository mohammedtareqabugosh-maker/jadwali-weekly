import { describe, expect, it } from 'vitest'
import { createSeedData } from '../data/seed'
import { importMeal } from './meals'

const payload = { id: 'nutrition-meal-1', name: 'وجبة من التطبيق الغذائي', kind: 'غداء', day: 0, start: '13:30', end: '14:00', calories: 500, protein: 30, source: 'مساعدي الغذائي' }

describe('تكامل الوجبات', () => {
  it('يستورد الوجبة ويحدثها بالمعرف نفسه دون تكرار', () => {
    const data = createSeedData()
    const first = importMeal(data, payload)
    expect(first.action).toBe('imported')
    const second = importMeal(first.data, { ...payload, name: 'اسم محدث', calories: 450 })
    expect(second.action).toBe('updated')
    expect(second.task.id).toBe(first.task.id)
    expect(second.data.tasks.filter((task) => task.meal?.externalId === payload.id)).toHaveLength(1)
    expect(second.task.title).toBe('اسم محدث')
    expect(second.task.meal?.nutrition?.calories).toBe(450)
  })
  it('يرفض وجبة بلا معرف أو بوقت غير صالح', () => {
    expect(() => importMeal(createSeedData(), { name: 'ناقصة' })).toThrow()
    expect(() => importMeal(createSeedData(), { ...payload, start: '25:00' })).toThrow()
  })
})
