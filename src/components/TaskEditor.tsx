import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Task, TaskType } from '../types'
import { DAYS, TASK_TYPE_LABELS } from '../types'
import { createId } from '../lib/id'
import { findConflicts, formatTime, validateTimes } from '../lib/time'
import { Modal } from './Modal'

interface TaskEditorProps {
  allTasks: Task[]
  goals: Array<{ id: string; name: string }>
  initial?: Task
  defaultDay: number
  defaultType?: TaskType
  copy?: boolean
  quick?: boolean
  onClose: () => void
  onSave: (tasks: Task[], editing: boolean) => void
}

const types = Object.keys(TASK_TYPE_LABELS) as TaskType[]

export function TaskEditor({ allTasks, goals, initial, defaultDay, defaultType = 'personal', copy = false, quick = false, onClose, onSave }: TaskEditorProps) {
  const editing = Boolean(initial && !copy)
  const base = useMemo<Task>(() => initial ? { ...initial, id: copy ? createId('task') : initial.id } : {
    id: createId('task'), title: '', type: defaultType, day: defaultDay, start: '18:00', end: '19:00', notes: '', fixed: false, allowSplit: true, countsTowardsProgress: defaultType !== 'sleep' && defaultType !== 'rest',
  }, [initial, copy, defaultDay, defaultType])
  const [draft, setDraft] = useState<Task>(base)
  const [repeatDays, setRepeatDays] = useState<Set<number>>(new Set([base.day]))
  const [error, setError] = useState('')
  const [conflictText, setConflictText] = useState('')
  const [allowConflicts, setAllowConflicts] = useState(false)

  const update = <K extends keyof Task>(key: K, value: Task[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) { setError('اكتب عنوان المهمة أولًا.'); return }
    const timeError = validateTimes(draft.start, draft.end)
    if (timeError) { setError(timeError); return }
    setError('')
    const days = editing ? [draft.day] : Array.from(repeatDays)
    if (!days.length) { setError('اختر يومًا واحدًا على الأقل.'); return }
    const seriesId = !editing && days.length > 1 ? createId('series') : draft.seriesId
    const candidates = days.map((day, index) => ({ ...draft, id: editing ? draft.id : index === 0 ? draft.id : createId('task'), day, title: draft.title.trim(), seriesId }))
    const conflicts = candidates.flatMap((candidate) => findConflicts(allTasks, candidate, editing ? candidate.id : undefined).map((task) => `«${candidate.title}» يوم ${DAYS[dayName(candidate.day)]} مع «${task.title}» (${formatTime(task.start)})`))
    if (conflicts.length && !allowConflicts) {
      setConflictText(conflicts.join('؛ '))
      return
    }
    onSave(candidates, editing)
  }

  return (
    <Modal title={editing ? 'تعديل المهمة' : copy ? 'نسخ المهمة' : quick ? 'إضافة سريعة' : 'مهمة جديدة'} description="لن تتغير أي مهمة أخرى دون مراجعتك." onClose={onClose} wide>
      <form className="form-stack" onSubmit={submit}>
        <label className="field-label">عنوان المهمة
          <input className="field" value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="مثال: مراجعة الفصل الثالث" maxLength={160} required />
        </label>
        <div className="form-grid two">
          <label className="field-label">النوع
            <select className="field" value={draft.type} onChange={(event) => { const type = event.target.value as TaskType; setDraft((current) => ({ ...current, type, countsTowardsProgress: type !== 'sleep' && type !== 'rest' })) }}>
              {types.map((type) => <option value={type} key={type}>{TASK_TYPE_LABELS[type]}</option>)}
            </select>
          </label>
          {editing || quick ? (
            <label className="field-label">اليوم
              <select className="field" value={draft.day} onChange={(event) => { const day = Number(event.target.value); update('day', day); setRepeatDays(new Set([day])) }}>
                {DAYS.map((day, index) => <option value={index} key={day}>{day}</option>)}
              </select>
            </label>
          ) : <div className="field-label">مدة التكرار<strong className="field-hint">أسبوعيًا في الأيام المحددة</strong></div>}
        </div>
        {!editing && !quick && (
          <fieldset className="repeat-days"><legend>تكرار المهمة في</legend>
            {DAYS.map((day, index) => <button type="button" key={day} className={repeatDays.has(index) ? 'selected' : ''} aria-pressed={repeatDays.has(index)} onClick={() => setRepeatDays((current) => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next })}>{day}</button>)}
          </fieldset>
        )}
        <div className="form-grid two time-fields">
          <label className="field-label">وقت البداية<input className="field" type="time" value={draft.start} onChange={(event) => update('start', event.target.value)} required /></label>
          <label className="field-label">وقت النهاية<input className="field" type="time" value={draft.end} onChange={(event) => update('end', event.target.value)} required /></label>
        </div>
        <p className="field-hint">لمهمة تنتهي عند منتصف الليل اختر 00:00، وستُحسب المدة بصورة صحيحة.</p>
        {!quick && (
          <>
            <label className="field-label">ملاحظات اختيارية<textarea className="field" rows={3} value={draft.notes} onChange={(event) => update('notes', event.target.value)} maxLength={1000} /></label>
            <label className="field-label">ربط بهدف اختياري
              <select className="field" value={draft.goalId ?? ''} onChange={(event) => update('goalId', event.target.value || undefined)}><option value="">بدون ربط</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select>
            </label>
            <div className="toggle-grid">
              <label className="check-label"><input type="checkbox" checked={draft.fixed} onChange={(event) => update('fixed', event.target.checked)} /> موعد ثابت لا يحركه مخرج الطوارئ</label>
              <label className="check-label"><input type="checkbox" checked={draft.allowSplit} onChange={(event) => update('allowSplit', event.target.checked)} /> يمكن اقتراح تقسيمها</label>
              <label className="check-label"><input type="checkbox" checked={draft.countsTowardsProgress} onChange={(event) => update('countsTowardsProgress', event.target.checked)} /> تدخل في نسبة الإنجاز</label>
            </div>
          </>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {conflictText && (
          <div className="conflict-box" role="alert"><AlertTriangle size={20} /><div><strong>يوجد تداخل في المواعيد</strong><p>{conflictText}</p><label className="check-label"><input type="checkbox" checked={allowConflicts} onChange={(event) => setAllowConflicts(event.target.checked)} /> أؤكد أن التداخل مقصود، مع إبقاء المهام الأخرى كما هي</label></div></div>
        )}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>إلغاء</button><button type="submit" className="primary-button">{editing ? 'حفظ التعديلات' : 'إضافة إلى الجدول'}</button></div>
      </form>
    </Modal>
  )
}

function dayName(day: number): number { return day }
