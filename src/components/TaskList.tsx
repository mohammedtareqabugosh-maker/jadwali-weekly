import { Check, Copy, Pencil, Trash2, AlertTriangle, Link2, LockKeyhole } from 'lucide-react'
import type { Task } from '../types'
import { TASK_TYPE_LABELS } from '../types'
import { durationMinutes, endMinutes, findConflicts, formatDuration, formatTime, isCompleted, nowMinutes, sortTasks, toMinutes } from '../lib/time'
import { TaskIcon } from './TaskIcon'

interface TaskListProps {
  tasks: Task[]
  allTasks: Task[]
  selectedDate: Date
  completions: Record<string, boolean>
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (task: Task) => void
  emptyAction?: () => void
  showActions?: boolean
}

export function TaskList({ tasks, allTasks, selectedDate, completions, onToggle, onEdit, onDuplicate, onDelete, emptyAction, showActions = true }: TaskListProps) {
  const sorted = sortTasks(tasks)
  const isToday = new Date().toDateString() === selectedDate.toDateString()
  const now = nowMinutes()
  if (!sorted.length) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <h3>هذا اليوم مفتوح لك</h3>
        <p>لا توجد مهام هنا. أضف أول مهمة أو استمتع بمساحة هادئة.</p>
        {emptyAction && <button type="button" className="secondary-button" onClick={emptyAction}>إضافة أول مهمة</button>}
      </div>
    )
  }
  return (
    <div className="timeline-list">
      {sorted.map((task) => {
        const completed = isCompleted(completions, selectedDate, task.id)
        const conflicts = findConflicts(allTasks, task)
        const current = isToday && toMinutes(task.start) <= now && now < endMinutes(task)
        return (
          <article className={`task-row type-${task.type} ${completed ? 'completed' : ''} ${current ? 'current' : ''}`} key={task.id} data-task-id={task.id}>
            <div className="task-time">
              <strong>{formatTime(task.start)}</strong>
              <span>{formatDuration(durationMinutes(task.start, task.end))}</span>
            </div>
            <div className="task-main">
              <div className="task-title-line">
                <span className="task-type-icon"><TaskIcon type={task.type} /></span>
                <div>
                  <h3>{task.title}</h3>
                  <p>{TASK_TYPE_LABELS[task.type]} · حتى {formatTime(task.end)}</p>
                </div>
              </div>
              {(task.notes || task.meal || conflicts.length > 0) && (
                <div className="task-meta">
                  {task.fixed && <span><LockKeyhole size={13} /> موعد ثابت</span>}
                  {task.meal && <span><Link2 size={13} /> {task.meal.source}</span>}
                  {task.meal?.nutrition?.calories !== undefined && <span>{task.meal.nutrition.calories} سعرة</span>}
                  {conflicts.length > 0 && <span className="conflict-label"><AlertTriangle size={13} /> يتعارض مع {conflicts.map((item) => item.title).join('، ')}</span>}
                  {task.notes && <span>{task.notes}</span>}
                </div>
              )}
            </div>
            <div className="task-actions">
              <button type="button" className={`complete-button ${completed ? 'is-complete' : ''}`} onClick={() => onToggle(task)} aria-label={completed ? `إلغاء إنجاز ${task.title}` : `تحديد ${task.title} كمكتملة`} aria-pressed={completed}>
                <Check size={20} />
              </button>
              {showActions && (
                <div className="secondary-actions">
                  <button type="button" className="small-icon-button" onClick={() => onEdit(task)} aria-label={`تعديل ${task.title}`}><Pencil size={17} /></button>
                  <button type="button" className="small-icon-button" onClick={() => onDuplicate(task)} aria-label={`نسخ ${task.title} إلى يوم آخر`}><Copy size={17} /></button>
                  <button type="button" className="small-icon-button danger" onClick={() => onDelete(task)} aria-label={`حذف ${task.title}`}><Trash2 size={17} /></button>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
