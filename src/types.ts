export type TaskType =
  | 'university'
  | 'online'
  | 'work'
  | 'study'
  | 'meal'
  | 'sleep'
  | 'rest'
  | 'sport'
  | 'personal'
  | 'other'

export interface Nutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface MealLink {
  externalId: string
  name: string
  kind: string
  date?: string
  source: string
  url?: string
  nutrition?: Nutrition
}

export interface Task {
  id: string
  title: string
  type: TaskType
  day: number
  start: string
  end: string
  notes: string
  fixed: boolean
  allowSplit: boolean
  countsTowardsProgress: boolean
  goalId?: string
  seriesId?: string
  meal?: MealLink
}

export interface Goal {
  id: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  target: number
  current: number
  unit: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
}

export interface Note {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
  day?: number
  taskId?: string
}

export interface Settings {
  displayName: string
  streakTarget: number
  theme: 'light' | 'dark'
}

export interface AppData {
  schemaVersion: number
  tasks: Task[]
  goals: Goal[]
  notes: Note[]
  completions: Record<string, boolean>
  settings: Settings
  createdAt: string
  updatedAt: string
}

export type View =
  | 'home'
  | 'schedule'
  | 'goals'
  | 'meals'
  | 'more'
  | 'emergency'
  | 'notes'
  | 'stats'
  | 'settings'

export interface ReplanProposal {
  taskId: string
  title: string
  oldStart: string
  oldEnd: string
  newStart: string
  newEnd: string
  reason: string
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  university: 'جامعة',
  online: 'محاضرة أونلاين',
  work: 'عمل',
  study: 'مذاكرة',
  meal: 'وجبة',
  sleep: 'نوم',
  rest: 'راحة',
  sport: 'رياضة',
  personal: 'مهمة شخصية',
  other: 'أخرى',
}

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
export const DAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
