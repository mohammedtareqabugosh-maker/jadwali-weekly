import { useMemo, useState } from 'react'
import { NotebookPen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { Note, Task } from '../types'
import { DAYS } from '../types'
import { createId } from '../lib/id'
import { Modal } from '../components/Modal'

interface NotesPageProps {
  notes: Note[]
  tasks: Task[]
  onCommit: (notes: Note[]) => void
  onDelete: (note: Note) => void
}

export function NotesPage({ notes, tasks, onCommit, onDelete }: NotesPageProps) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [isNew, setIsNew] = useState(false)
  const filtered = useMemo(() => notes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes, query])
  const openNew = () => { const now = new Date().toISOString(); setIsNew(true); setEditing({ id: createId('note'), title: '', body: '', createdAt: now, updatedAt: now }) }
  const save = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing?.title.trim() && !editing?.body.trim()) return
    const normalized = { ...editing, title: editing.title.trim() || 'ملاحظة بلا عنوان', updatedAt: new Date().toISOString() }
    onCommit(isNew ? [...notes, normalized] : notes.map((note) => note.id === normalized.id ? normalized : note))
    setEditing(null)
  }
  return <div className="page-stack">
    <section className="page-heading"><div><span className="section-kicker">أفكارك في مكان واحد</span><h1>الملاحظات</h1><p>احفظ فكرة، أو اربط ملاحظة بيوم أو مهمة. كل شيء يبقى على جهازك.</p></div><button type="button" className="primary-button" onClick={openNew}><Plus size={19} /> ملاحظة جديدة</button></section>
    <label className="search-field page-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في العناوين والمحتوى" aria-label="البحث في الملاحظات" /></label>
    {filtered.length ? <div className="notes-list">{filtered.map((note) => <article className="note-item" key={note.id}><div className="note-head"><div><h2>{note.title}</h2><time dateTime={note.updatedAt}>آخر تعديل: {new Intl.DateTimeFormat('ar-JO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.updatedAt))}</time></div><div className="goal-actions"><button type="button" className="small-icon-button" onClick={() => { setIsNew(false); setEditing({ ...note }) }} aria-label={`تعديل ${note.title}`}><Pencil size={17} /></button><button type="button" className="small-icon-button danger" onClick={() => onDelete(note)} aria-label={`حذف ${note.title}`}><Trash2 size={17} /></button></div></div><p>{note.body || 'لا يوجد محتوى إضافي.'}</p>{(note.day !== undefined || note.taskId) && <span className="note-link">{note.taskId ? `مرتبطة بـ ${tasks.find((task) => task.id === note.taskId)?.title ?? 'مهمة محذوفة'}` : `مرتبطة بيوم ${DAYS[note.day!]}`}</span>}</article>)}</div> : <div className="empty-state"><NotebookPen size={28} /><h2>{notes.length ? 'لا توجد نتائج مطابقة' : 'صفحتك جاهزة لأول فكرة'}</h2><p>{notes.length ? 'جرّب عبارة بحث أخرى.' : 'الملاحظات لا تختفي عند الانتقال بين الأقسام أو إغلاق التطبيق.'}</p>{!notes.length && <button type="button" className="secondary-button" onClick={openNew}>إضافة أول ملاحظة</button>}</div>}
    {editing && <Modal title={isNew ? 'ملاحظة جديدة' : 'تعديل الملاحظة'} onClose={() => setEditing(null)} wide><form className="form-stack" onSubmit={save}>
      <label className="field-label">العنوان<input className="field" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} placeholder="عنوان قصير" maxLength={140} /></label>
      <label className="field-label">الملاحظة<textarea className="field" rows={7} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} placeholder="اكتب ما تريد تذكره…" maxLength={10000} /></label>
      <div className="form-grid two"><label className="field-label">ربط بيوم<select className="field" value={editing.day ?? ''} onChange={(event) => setEditing({ ...editing, day: event.target.value === '' ? undefined : Number(event.target.value) })}><option value="">بدون يوم</option>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="field-label">ربط بمهمة<select className="field" value={editing.taskId ?? ''} onChange={(event) => setEditing({ ...editing, taskId: event.target.value || undefined })}><option value="">بدون مهمة</option>{tasks.map((task) => <option key={task.id} value={task.id}>{DAYS[task.day]} — {task.title}</option>)}</select></label></div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>إلغاء</button><button type="submit" className="primary-button">حفظ الملاحظة</button></div>
    </form></Modal>}
  </div>
}
