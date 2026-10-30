import { useState } from 'react'
import { Minus, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import type { Goal } from '../types'
import { createId } from '../lib/id'
import { Modal } from '../components/Modal'

interface GoalsPageProps {
  goals: Goal[]
  onCommit: (goals: Goal[]) => void
  onDelete: (goal: Goal) => void
}

const emptyGoal = (): Goal => ({ id: createId('goal'), name: '', description: '', target: 1, current: 0, unit: 'مرة', status: 'active', createdAt: new Date().toISOString() })

export function GoalsPage({ goals, onCommit, onDelete }: GoalsPageProps) {
  const [editing, setEditing] = useState<Goal | null>(null)
  const [isNew, setIsNew] = useState(false)
  const save = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing?.name.trim() || editing.target <= 0) return
    const normalized = { ...editing, name: editing.name.trim(), current: Math.min(editing.current, editing.target), status: editing.current >= editing.target ? 'completed' as const : editing.status }
    onCommit(isNew ? [...goals, normalized] : goals.map((goal) => goal.id === normalized.id ? normalized : goal))
    setEditing(null)
  }
  const adjust = (goal: Goal, amount: number) => {
    const current = Math.max(0, Math.min(goal.target, goal.current + amount))
    onCommit(goals.map((item) => item.id === goal.id ? { ...item, current, status: current >= item.target ? 'completed' : 'active' } : item))
  }
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="section-kicker">تقدم صغير، أثر مستمر</span><h1>الأهداف والعادات</h1><p>حدّث قيمك المنجزة يدويًا، واربط المهام بالهدف المناسب دون احتساب مزدوج.</p></div><button type="button" className="primary-button" onClick={() => { setIsNew(true); setEditing(emptyGoal()) }}><Plus size={19} /> هدف جديد</button></section>
      {goals.length ? <div className="goals-grid">{goals.map((goal) => {
        const percent = Math.min(100, Math.round(goal.current / goal.target * 100))
        return <article className="goal-item" key={goal.id}>
          <div className="goal-top"><span className="goal-icon"><Target size={21} /></span><div className="goal-actions"><button type="button" className="small-icon-button" onClick={() => { setIsNew(false); setEditing({ ...goal }) }} aria-label={`تعديل ${goal.name}`}><Pencil size={17} /></button><button type="button" className="small-icon-button danger" onClick={() => onDelete(goal)} aria-label={`حذف ${goal.name}`}><Trash2 size={17} /></button></div></div>
          <h2>{goal.name}</h2><p>{goal.description || 'هدف شخصي قابل للمتابعة.'}</p>
          <div className="goal-numbers"><strong>{goal.current}<small> / {goal.target} {goal.unit}</small></strong><span>{percent}%</span></div>
          <div className="linear-progress" aria-label={`تقدم ${goal.name} ${percent}%`}><span style={{ width: `${percent}%` }} /></div>
          <div className="goal-bottom"><span>{goal.status === 'completed' ? 'اكتمل الهدف' : goal.status === 'paused' ? 'متوقف مؤقتًا' : 'قيد التقدم'}</span><div><button type="button" className="small-icon-button" onClick={() => adjust(goal, -1)} disabled={goal.current <= 0} aria-label="إنقاص القيمة"><Minus size={17} /></button><button type="button" className="secondary-button compact-button" onClick={() => adjust(goal, 1)} disabled={goal.current >= goal.target}><Plus size={17} /> تسجيل تقدم</button></div></div>
        </article>
      })}</div> : <div className="empty-state"><Target size={28} /><h2>ابدأ بهدف واحد واضح</h2><p>اختر قيمة يمكن قياسها، ثم حدّثها كلما تقدمت.</p><button type="button" className="secondary-button" onClick={() => { setIsNew(true); setEditing(emptyGoal()) }}>إضافة أول هدف</button></div>}
      {editing && <Modal title={isNew ? 'هدف جديد' : 'تعديل الهدف'} onClose={() => setEditing(null)}><form className="form-stack" onSubmit={save}>
        <label className="field-label">اسم الهدف<input className="field" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required maxLength={120} /></label>
        <label className="field-label">وصف اختياري<textarea className="field" rows={2} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
        <div className="form-grid two"><label className="field-label">تاريخ البداية<input className="field" type="date" value={editing.startDate ?? ''} onChange={(event) => setEditing({ ...editing, startDate: event.target.value || undefined })} /></label><label className="field-label">تاريخ النهاية<input className="field" type="date" value={editing.endDate ?? ''} onChange={(event) => setEditing({ ...editing, endDate: event.target.value || undefined })} /></label></div>
        <div className="form-grid three"><label className="field-label">القيمة المستهدفة<input className="field" type="number" min="0.1" step="0.1" value={editing.target} onChange={(event) => setEditing({ ...editing, target: Number(event.target.value) })} required /></label><label className="field-label">القيمة المنجزة<input className="field" type="number" min="0" step="0.1" value={editing.current} onChange={(event) => setEditing({ ...editing, current: Number(event.target.value) })} required /></label><label className="field-label">وحدة القياس<input className="field" value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} required /></label></div>
        <label className="field-label">حالة الهدف<select className="field" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as Goal['status'] })}><option value="active">قيد التقدم</option><option value="paused">متوقف مؤقتًا</option><option value="completed">مكتمل</option></select></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>إلغاء</button><button type="submit" className="primary-button">حفظ الهدف</button></div>
      </form></Modal>}
    </div>
  )
}
