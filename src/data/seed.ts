import type { AppData, Task, TaskType } from '../types'

function task(id: string, day: number, start: string, end: string, title: string, type: TaskType, options: Partial<Task> = {}): Task {
  return {
    id,
    day,
    start,
    end,
    title,
    type,
    notes: '',
    fixed: type === 'university' || type === 'online' || type === 'work',
    allowSplit: type === 'study' || type === 'personal' || type === 'other',
    countsTowardsProgress: type !== 'sleep' && type !== 'rest',
    ...options,
  }
}

function dailyMeals(day: number): Task[] {
  return [
    task(`meal_${day}_breakfast`, day, '07:45', '08:00', 'الإفطار', 'meal', { fixed: false }),
    task(`meal_${day}_dinner`, day, '19:00', '19:30', 'العشاء', 'meal', { fixed: false }),
  ]
}

export function createSeedData(): AppData {
  const now = new Date().toISOString()
  const sunday: Task[] = [
    task('sun_sleep', 0, '00:00', '07:15', 'النوم', 'sleep'),
    task('sun_wake', 0, '07:15', '07:45', 'الاستيقاظ والتجهيز', 'personal', { fixed: false }),
    ...dailyMeals(0).slice(0, 1),
    task('sun_digital', 0, '09:00', '10:00', 'محاضرة Digital Logic', 'university'),
    task('sun_algebra', 0, '10:00', '11:00', 'محاضرة Linear Algebra', 'university'),
    task('sun_lunch', 0, '11:00', '12:00', 'الغداء', 'meal', { fixed: false }),
    task('sun_rest', 0, '12:00', '13:00', 'راحة', 'rest', { fixed: false }),
    task('sun_programming', 0, '13:00', '14:00', 'محاضرة Programming', 'university'),
    task('sun_lab', 0, '14:00', '16:00', 'مختبر Programming', 'university'),
    task('sun_study_code', 0, '16:30', '18:30', 'مذاكرة البرمجة', 'study', { fixed: false }),
    ...dailyMeals(0).slice(1),
    task('sun_study_algebra', 0, '19:30', '21:00', 'مذاكرة الجبر الخطي', 'study', { fixed: false }),
    task('sun_review', 0, '21:00', '21:30', 'مراجعة أسبوعية', 'personal', { fixed: false }),
    task('sun_personal', 0, '21:30', '00:00', 'وقت شخصي', 'personal', { fixed: false }),
  ]

  const tasks: Task[] = [...sunday]
  const workDays = [1, 2, 3, 4, 5, 6]
  for (const day of workDays) {
    tasks.push(task(`wake_${day}`, day, '08:00', '08:30', 'الاستيقاظ والتجهيز', 'personal', { fixed: false }))
    tasks.push(...dailyMeals(day))
    const late = day === 2 || day === 4
    tasks.push(task(`work_${day}`, day, late ? '15:00' : '09:00', late ? '23:00' : '19:00', 'العمل', 'work'))
    if (late) {
      tasks.push(task(`commute_${day}`, day, '23:00', '23:45', 'الانتقال من العمل', 'personal', { fixed: true, allowSplit: false, notes: 'مدة الانتقال 45 دقيقة وقابلة للتعديل.' }))
      tasks.push(task(`study_${day}`, day, '10:00', '11:00', 'مذاكرة ذاتية', 'study', { fixed: false }))
    } else {
      tasks.push(task(`study_${day}`, day, '20:00', '21:00', 'مذاكرة ذاتية', 'study', { fixed: false }))
    }
  }
  tasks.push(task('mon_online', 1, '11:00', '12:00', 'محاضرة التربية الوطنية أونلاين', 'online', { notes: 'محاضرة متزامنة مع فترة العمل؛ لا تُجمع مدتها مع إجمالي الوقت المشغول.' }))
  tasks.push(task('tue_online', 2, '13:00', '14:00', 'محاضرة البرمجة أونلاين', 'online'))

  return {
    schemaVersion: 1,
    tasks,
    goals: [
      { id: 'goal_study', name: 'المذاكرة الذاتية', description: 'هدف أسبوعي قابل للتعديل', target: 9, current: 0, unit: 'ساعة', status: 'active', createdAt: now },
      { id: 'goal_reading', name: 'القراءة', description: '', target: 5, current: 0, unit: 'جلسة', status: 'active', createdAt: now },
    ],
    notes: [],
    completions: {},
    settings: { displayName: '', streakTarget: 70, theme: 'light' },
    createdAt: now,
    updatedAt: now,
  }
}
