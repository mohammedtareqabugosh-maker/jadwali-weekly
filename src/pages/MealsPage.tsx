import { useRef, useState } from 'react'
import { Check, Download, ExternalLink, FileJson, Link2Off, Plus, Upload, Utensils } from 'lucide-react'
import type { Task } from '../types'
import { DAYS } from '../types'
import { formatTime, isCompleted, sortTasks } from '../lib/time'
import { DayStrip } from '../components/DayStrip'
import { exportMeal } from '../lib/meals'

interface MealsPageProps {
  tasks: Task[]
  selectedDay: number
  selectedDate: Date
  completions: Record<string, boolean>
  onSelectDay: (day: number) => void
  onAdd: () => void
  onToggle: (task: Task) => void
  onImport: (payload: unknown) => 'imported' | 'updated'
  onUnlink: (task: Task) => void
}

export function MealsPage({ tasks, selectedDay, selectedDate, completions, onSelectDay, onAdd, onToggle, onImport, onUnlink }: MealsPageProps) {
  const [showImport, setShowImport] = useState(false)
  const [json, setJson] = useState('')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const meals = sortTasks(tasks.filter((task) => task.day === selectedDay && task.type === 'meal'))
  const runImport = (payload: unknown) => {
    try {
      const action = onImport(payload)
      setMessage(action === 'updated' ? 'حُدّثت الوجبة المرتبطة دون إنشاء نسخة مكررة.' : 'أُضيفت الوجبة إلى موعدها في الجدول.')
      setJson('')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر استيراد الوجبة.') }
  }
  return <div className="page-stack">
    <section className="page-heading"><div><span className="section-kicker">الموعد هنا، والتفاصيل من مصدرها</span><h1>الوجبات</h1><p>استورد وجبات «مساعدي الغذائي» بصيغة JSON. المعرّف الثابت يمنع التكرار ويحدّث البيانات المرتبطة.</p></div><div className="heading-actions"><button type="button" className="secondary-button" onClick={() => setShowImport(!showImport)}><Upload size={18} /> استيراد وجبة</button><button type="button" className="primary-button" onClick={onAdd}><Plus size={19} /> وجبة غير مرتبطة</button></div></section>
    {showImport && <section className="import-panel"><div className="section-heading compact"><div><h2>استيراد من مساعدي الغذائي</h2><p>الصق JSON أو اختر ملفًا. الحقول الأساسية: id، name، day، start، end.</p></div><button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><FileJson size={18} /> اختيار ملف</button></div><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { runImport(JSON.parse(await file.text())) } catch { setMessage('ملف JSON غير صالح.') } event.target.value = '' }} /><textarea className="field code-field" dir="ltr" rows={5} value={json} onChange={(event) => setJson(event.target.value)} placeholder='{"id":"meal-001","name":"الغداء","day":0,"start":"13:00","end":"13:30","source":"مساعدي الغذائي"}' /><div className="form-actions"><button type="button" className="primary-button" onClick={() => { try { runImport(JSON.parse(json)) } catch { setMessage('صيغة JSON غير صحيحة. راجع الفواصل وعلامات الاقتباس.') } }} disabled={!json.trim()}>تحقق واستورد</button><button type="button" className="text-action" onClick={() => { setShowImport(false); setMessage('') }}>إغلاق</button></div>{message && <p className="form-message" role="status">{message}</p>}</section>}
    <DayStrip selectedDay={selectedDay} onSelect={onSelectDay} today={new Date()} />
    <section className="content-section"><div className="section-heading"><div><h2>وجبات {DAYS[selectedDay]}</h2><p>{meals.length ? `${meals.length} مواعيد مسجلة` : 'لا توجد محتويات غذائية افتراضية هنا'}</p></div></div>
      {meals.length ? <div className="meals-list">{meals.map((meal) => { const done = isCompleted(completions, selectedDate, meal.id); const nutrition = meal.meal?.nutrition; return <article className={`meal-row ${done ? 'completed' : ''}`} key={meal.id}><div className="meal-symbol"><Utensils size={20} /></div><div className="meal-copy"><div><h3>{meal.title}</h3><p>{formatTime(meal.start)} — {formatTime(meal.end)}</p></div>{meal.meal ? <span className="linked-badge">{meal.meal.source}</span> : <span className="unlinked-badge">موعد محلي</span>}{nutrition && <div className="nutrition-line">{nutrition.calories !== undefined && <span>{nutrition.calories} سعرة</span>}{nutrition.protein !== undefined && <span>بروتين {nutrition.protein}غ</span>}{nutrition.carbs !== undefined && <span>كربوهيدرات {nutrition.carbs}غ</span>}{nutrition.fat !== undefined && <span>دهون {nutrition.fat}غ</span>}</div>}</div><div className="meal-actions"><button type="button" className={`complete-button ${done ? 'is-complete' : ''}`} onClick={() => onToggle(meal)} aria-label={done ? 'إلغاء تناول الوجبة' : 'تسجيل تناول الوجبة'}><Check size={19} /></button>{meal.meal?.url && <a className="small-icon-button" href={meal.meal.url} target="_blank" rel="noreferrer" aria-label="فتح تفاصيل الوجبة"><ExternalLink size={17} /></a>}{meal.meal && <button type="button" className="small-icon-button" onClick={() => exportMeal(meal)} aria-label="تصدير الوجبة"><Download size={17} /></button>}{meal.meal && <button type="button" className="small-icon-button danger" onClick={() => onUnlink(meal)} aria-label="إزالة ربط الوجبة"><Link2Off size={17} /></button>}</div></article>})}</div> : <div className="empty-state"><Utensils size={28} /><h3>لا توجد وجبات في هذا اليوم</h3><p>أضف موعدًا محليًا أو استورد وجبة من مساعدي الغذائي.</p><button type="button" className="secondary-button" onClick={onAdd}>إضافة موعد وجبة</button></div>}
    </section>
  </div>
}
