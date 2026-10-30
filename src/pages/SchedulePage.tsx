import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarPlus, Search } from 'lucide-react'
import type { AppData, Task } from '../types'
import { DAYS } from '../types'
import { findConflicts, isCompleted } from '../lib/time'
import { DayStrip } from '../components/DayStrip'
import { TaskList } from '../components/TaskList'

interface SchedulePageProps {
  data: AppData
  selectedDay: number
  selectedDate: Date
  onSelectDay: (day: number) => void
  onAdd: (quick?: boolean) => void
  onEdit: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (task: Task) => void
  onToggle: (task: Task) => void
}

export function SchedulePage({ data, selectedDay, selectedDate, onSelectDay, onAdd, onEdit, onDuplicate, onDelete, onToggle }: SchedulePageProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'remaining' | 'completed'>('all')
  const tasks = useMemo(() => data.tasks.filter((task) => {
    if (task.day !== selectedDay) return false
    if (search && !`${task.title} ${task.notes}`.toLowerCase().includes(search.trim().toLowerCase())) return false
    const completed = isCompleted(data.completions, selectedDate, task.id)
    return filter === 'all' || (filter === 'completed' ? completed : !completed)
  }), [data.tasks, data.completions, selectedDay, selectedDate, search, filter])
  const dayTasks = data.tasks.filter((task) => task.day === selectedDay)
  const conflictCount = dayTasks.reduce((sum, task) => sum + findConflicts(dayTasks, task).length, 0) / 2

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="section-kicker">أسبوعك، بالتفصيل</span><h1>الجدول الأسبوعي</h1><p>عدّل يومًا واحدًا أو كرّر مهمة في أيام عدة. كل تغيير تحت سيطرتك.</p></div>
        <button type="button" className="primary-button" onClick={() => onAdd(false)}><CalendarPlus size={19} /> مهمة مفصلة</button>
      </section>
      <DayStrip selectedDay={selectedDay} onSelect={onSelectDay} today={new Date()} />
      {conflictCount > 0 && <div className="inline-alert"><AlertTriangle size={20} /><p>يوجد {conflictCount} تداخل في {DAYS[selectedDay]}. لم نغيّر أي مهمة تلقائيًا؛ افتح المهمة لمراجعة وقتها.</p></div>}
      <section className="content-section">
        <div className="schedule-tools">
          <label className="search-field"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في مهام هذا اليوم" aria-label="البحث في المهام" /></label>
          <div className="segmented-control" aria-label="تصفية المهام">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>الكل</button>
            <button type="button" className={filter === 'remaining' ? 'active' : ''} onClick={() => setFilter('remaining')}>المتبقية</button>
            <button type="button" className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>المنجزة</button>
          </div>
        </div>
        <div className="section-heading"><div><h2>{DAYS[selectedDay]}</h2><p>{tasks.length} مهمة ظاهرة · مرتبة حسب وقت البداية</p></div></div>
        <TaskList tasks={tasks} allTasks={data.tasks} selectedDate={selectedDate} completions={data.completions} onToggle={onToggle} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} emptyAction={() => onAdd(false)} />
      </section>
    </div>
  )
}
