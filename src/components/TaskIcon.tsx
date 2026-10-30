import { BookOpen, BriefcaseBusiness, Circle, Coffee, Dumbbell, GraduationCap, Monitor, Moon, Utensils, UserRound } from 'lucide-react'
import type { TaskType } from '../types'

const icons = {
  university: GraduationCap,
  online: Monitor,
  work: BriefcaseBusiness,
  study: BookOpen,
  meal: Utensils,
  sleep: Moon,
  rest: Coffee,
  sport: Dumbbell,
  personal: UserRound,
  other: Circle,
}

export function TaskIcon({ type, size = 19 }: { type: TaskType; size?: number }) {
  const Icon = icons[type]
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}
