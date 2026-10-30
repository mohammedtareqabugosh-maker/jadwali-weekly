import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChart3, CalendarDays, CloudOff, Home, MoreHorizontal, NotebookPen, Settings, Sparkles, Target, Utensils, Wifi, X } from 'lucide-react'
import type { AppData, Goal, Note, Settings as SettingsType, Task, View } from './types'
import { loadData, saveData } from './lib/storage'
import { completionKey, weekDates } from './lib/time'
import { importMeal } from './lib/meals'
import { Modal } from './components/Modal'
import { TaskEditor } from './components/TaskEditor'
import { HomePage } from './pages/HomePage'
import { SchedulePage } from './pages/SchedulePage'
import { GoalsPage } from './pages/GoalsPage'
import { MealsPage } from './pages/MealsPage'
import { MorePage } from './pages/MorePage'
import { NotesPage } from './pages/NotesPage'
import { StatsPage } from './pages/StatsPage'
import { EmergencyPage } from './pages/EmergencyPage'
import { SettingsPage } from './pages/SettingsPage'

interface EditorState { initial?: Task; copy: boolean; quick: boolean; defaultType?: Task['type'] }
interface DeleteTarget { kind: 'task' | 'goal' | 'note'; id: string; title: string }
interface ToastState { message: string; actionLabel?: string; action?: () => void }
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const primaryNav: Array<{ view: View; label: string; icon: typeof Home }> = [
  { view: 'home', label: 'الرئيسية', icon: Home },
  { view: 'schedule', label: 'الجدول', icon: CalendarDays },
  { view: 'goals', label: 'الأهداف', icon: Target },
  { view: 'meals', label: 'الوجبات', icon: Utensils },
  { view: 'more', label: 'المزيد', icon: MoreHorizontal },
]

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'compact' : ''}`}><span className="brand-mark" aria-hidden="true"><CalendarDays size={24} /><i /></span><div><strong>جدولي الأسبوعي</strong>{!compact && <small>Weekly Schedule</small>}</div></div>
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [view, setView] = useState<View>('home')
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)
  const skipInitialSave = useRef(true)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let active = true
    loadData().then((loadedData) => { if (active) { setData(loadedData); loaded.current = true } }).catch((error) => { if (active) setLoadError(error.message) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!data || !loaded.current) return
    if (skipInitialSave.current) { skipInitialSave.current = false; return }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving')
      saveData(data).then(() => setSaveStatus('saved')).catch((error) => { setSaveStatus('error'); setToast({ message: error.message }) })
    }, 180)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [data])

  useEffect(() => {
    document.documentElement.dataset.theme = data?.settings.theme ?? 'light'
    document.documentElement.style.colorScheme = data?.settings.theme ?? 'light'
  }, [data?.settings.theme])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.removeEventListener('beforeinstallprompt', onInstall) }
  }, [])

  useEffect(() => {
    if (!toast) return
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 6000)
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [toast])

  const selectedDate = weekDates(new Date())[selectedDay]
  const updateData = useCallback((updater: (current: AppData) => AppData) => setData((current) => current ? updater(current) : current), [])
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const selectDay = (day: number) => setSelectedDay(day)
  const openEditor = (quick = false, initial?: Task, copy = false, defaultType?: Task['type']) => setEditor({ quick, initial, copy, defaultType })

  const saveTasks = (tasks: Task[], editing: boolean) => {
    if (!data) return
    updateData((current) => ({ ...current, tasks: editing ? current.tasks.map((task) => task.id === tasks[0].id ? tasks[0] : task) : [...current.tasks, ...tasks], updatedAt: new Date().toISOString() }))
    setEditor(null)
    setToast({ message: editing ? 'حُفظت التعديلات وبقيت حالة الإنجاز كما هي.' : tasks.length > 1 ? `أُضيفت المهمة إلى ${tasks.length} أيام.` : 'أُضيفت المهمة إلى الجدول.' })
  }

  const toggleTask = (task: Task) => {
    const key = completionKey(selectedDate, task.id)
    updateData((current) => {
      const completions = { ...current.completions }
      if (completions[key]) delete completions[key]
      else completions[key] = true
      return { ...current, completions, updatedAt: new Date().toISOString() }
    })
  }

  const askDeleteTask = (task: Task) => setDeleteTarget({ kind: 'task', id: task.id, title: task.title })
  const confirmDelete = () => {
    if (!deleteTarget || !data) return
    const { kind, id } = deleteTarget
    if (kind === 'task') {
      const task = data.tasks.find((item) => item.id === id)
      if (task) {
        const index = data.tasks.findIndex((item) => item.id === id)
        updateData((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== id) }))
        setToast({ message: `حُذفت «${task.title}».`, actionLabel: 'تراجع', action: () => { updateData((current) => { const tasks = [...current.tasks]; tasks.splice(Math.min(index, tasks.length), 0, task); return { ...current, tasks } }); setToast({ message: 'عادت المهمة إلى مكانها.' }) } })
      }
    } else if (kind === 'goal') {
      updateData((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== id), tasks: current.tasks.map((task) => task.goalId === id ? { ...task, goalId: undefined } : task) }))
      setToast({ message: 'حُذف الهدف وأُزيل ارتباطه بالمهام.' })
    } else {
      updateData((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }))
      setToast({ message: 'حُذفت الملاحظة.' })
    }
    setDeleteTarget(null)
  }

  const importMealPayload = (payload: unknown): 'imported' | 'updated' => {
    if (!data) throw new Error('البيانات غير جاهزة.')
    const result = importMeal(data, payload)
    setData(result.data)
    setSelectedDay(result.task.day)
    setToast({ message: result.action === 'updated' ? 'حُدّثت الوجبة دون تكرارها.' : 'استُوردت الوجبة إلى الجدول.' })
    return result.action
  }

  const commitGoals = (goals: Goal[]) => { updateData((current) => ({ ...current, goals })); setToast({ message: 'حُفظت الأهداف.' }) }
  const commitNotes = (notes: Note[]) => { updateData((current) => ({ ...current, notes })); setToast({ message: 'حُفظت الملاحظات.' }) }
  const updateSettings = (settings: SettingsType) => updateData((current) => ({ ...current, settings }))
  const install = async () => { if (!installPrompt) return; await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === 'accepted') setToast({ message: 'بدأ تثبيت التطبيق.' }); setInstallPrompt(null) }

  if (loadError) return <main className="fatal-state"><Brand /><h1>تعذر فتح بياناتك</h1><p>{loadError}</p><button type="button" className="primary-button" onClick={() => window.location.reload()}>إعادة المحاولة</button></main>
  if (!data) return <main className="loading-state"><Brand /><div className="loading-line"><span /></div><p>نفتح جدولك المحفوظ على هذا الجهاز…</p></main>

  const shared = { data, selectedDay, selectedDate, onSelectDay: selectDay, onAdd: (quick = false) => openEditor(quick), onEdit: (task: Task) => openEditor(false, task), onDuplicate: (task: Task) => openEditor(false, task, true), onDelete: askDeleteTask, onToggle: toggleTask }
  const activePrimary = ['notes', 'stats', 'settings', 'emergency'].includes(view) ? 'more' : view

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">تخطَّ إلى المحتوى</a>
      <aside className="desktop-sidebar">
        <Brand />
        <nav aria-label="التنقل الرئيسي">{primaryNav.map(({ view: target, label, icon: Icon }) => <button type="button" key={target} className={activePrimary === target ? 'active' : ''} onClick={() => navigate(target)}><Icon size={20} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-divider" />
        <nav aria-label="أدوات إضافية">{[{ view: 'emergency' as View, label: 'مخرج الطوارئ', icon: Sparkles }, { view: 'notes' as View, label: 'الملاحظات', icon: NotebookPen }, { view: 'stats' as View, label: 'الإحصائيات', icon: BarChart3 }, { view: 'settings' as View, label: 'الإعدادات', icon: Settings }].map(({ view: target, label, icon: Icon }) => <button type="button" key={target} className={view === target ? 'active' : ''} onClick={() => navigate(target)}><Icon size={20} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-foot"><span className={`save-indicator ${saveStatus}`}><i />{saveStatus === 'saving' ? 'جارٍ الحفظ' : saveStatus === 'error' ? 'تعذر الحفظ' : 'محفوظ محليًا'}</span><small>لا حساب. لا مزامنة تلقائية.</small></div>
      </aside>

      <header className="mobile-header"><Brand compact /><span className={`network-badge ${online ? '' : 'offline'}`} title={online ? 'متصل' : 'غير متصل'}>{online ? <Wifi size={17} /> : <CloudOff size={17} />}<span>{online ? 'محلي' : 'دون اتصال'}</span></span></header>
      <main className="main-content" id="main-content">
        <div className="desktop-status"><span className={`save-indicator ${saveStatus}`}><i />{saveStatus === 'saving' ? 'جارٍ الحفظ محليًا' : saveStatus === 'error' ? 'تعذر الحفظ — راجع مساحة المتصفح' : 'كل التغييرات محفوظة محليًا'}</span><span className={`network-badge ${online ? '' : 'offline'}`}>{online ? <Wifi size={16} /> : <CloudOff size={16} />}{online ? 'متصل' : 'دون اتصال'}</span></div>
        {view === 'home' && <HomePage {...shared} onNavigate={navigate} />}
        {view === 'schedule' && <SchedulePage {...shared} />}
        {view === 'goals' && <GoalsPage goals={data.goals} onCommit={commitGoals} onDelete={(goal) => setDeleteTarget({ kind: 'goal', id: goal.id, title: goal.name })} />}
        {view === 'meals' && <MealsPage tasks={data.tasks} selectedDay={selectedDay} selectedDate={selectedDate} completions={data.completions} onSelectDay={selectDay} onAdd={() => openEditor(false, undefined, false, 'meal')} onToggle={toggleTask} onImport={importMealPayload} onUnlink={(task) => { updateData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, meal: undefined } : item) })); setToast({ message: 'أُزيل الربط وبقي موعد الوجبة في الجدول.' }) }} />}
        {view === 'more' && <MorePage onNavigate={navigate} online={online} />}
        {view === 'notes' && <NotesPage notes={data.notes} tasks={data.tasks} onCommit={commitNotes} onDelete={(note) => setDeleteTarget({ kind: 'note', id: note.id, title: note.title })} />}
        {view === 'stats' && <StatsPage data={data} selectedDate={selectedDate} />}
        {view === 'emergency' && <EmergencyPage data={data} selectedDay={selectedDay} selectedDate={selectedDate} onApply={(tasks) => { updateData((current) => ({ ...current, tasks })); setToast({ message: 'طُبّقت التعديلات المقترحة بعد موافقتك.' }) }} />}
        {view === 'settings' && <SettingsPage data={data} onSettings={updateSettings} onReplace={(replacement) => setData(replacement)} canInstall={Boolean(installPrompt)} onInstall={install} />}
      </main>

      <nav className="bottom-nav" aria-label="التنقل الرئيسي">{primaryNav.map(({ view: target, label, icon: Icon }) => <button type="button" key={target} className={activePrimary === target ? 'active' : ''} onClick={() => navigate(target)} aria-current={activePrimary === target ? 'page' : undefined}><Icon size={21} /><span>{label}</span></button>)}</nav>

      {editor && <TaskEditor allTasks={data.tasks} goals={data.goals} initial={editor.initial} defaultDay={selectedDay} defaultType={editor.defaultType} copy={editor.copy} quick={editor.quick} onClose={() => setEditor(null)} onSave={saveTasks} />}
      {deleteTarget && <Modal title="تأكيد الحذف" onClose={() => setDeleteTarget(null)}><div className="delete-confirm"><p>هل تريد حذف «{deleteTarget.title}»؟</p><span>{deleteTarget.kind === 'task' ? 'يمكنك التراجع مباشرة بعد الحذف.' : deleteTarget.kind === 'goal' ? 'ستبقى المهام، لكن سيُزال ارتباطها بهذا الهدف.' : 'سيُحذف محتوى الملاحظة من هذا المتصفح.'}</span><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDeleteTarget(null)}>إلغاء</button><button type="button" className="danger-button" onClick={confirmDelete}>تأكيد الحذف</button></div></div></Modal>}
      {toast && <div className="toast" role="status"><span>{toast.message}</span>{toast.action && <button type="button" onClick={toast.action}>{toast.actionLabel}</button>}<button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="إغلاق الرسالة"><X size={16} /></button></div>}
    </div>
  )
}
