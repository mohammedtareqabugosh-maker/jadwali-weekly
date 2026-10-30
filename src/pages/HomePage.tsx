import { ArrowLeft, CalendarPlus, CheckCircle2, Circle, Clock3, Flame, Lightbulb, NotebookPen, Sparkles, Target, Utensils } from 'lucide-react'
import type { AppData, Task, View } from '../types'
import { DAYS } from '../types'
import { calculatePeriodStats, getStreak } from '../lib/stats'
import { formatArabicDate, formatTime, getCurrentAndNext, isCompleted, nowMinutes, sortTasks } from '../lib/time'
import { DayStrip } from '../components/DayStrip'
import { ProgressRing } from '../components/ProgressRing'
import { TaskList } from '../components/TaskList'

interface HomePageProps {
  data: AppData
  selectedDay: number
  selectedDate: Date
  onSelectDay: (day: number) => void
  onAdd: (quick?: boolean) => void
  onEdit: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (task: Task) => void
  onToggle: (task: Task) => void
  onNavigate: (view: View) => void
}

export function HomePage({ data, selectedDay, selectedDate, onSelectDay, onAdd, onEdit, onDuplicate, onDelete, onToggle, onNavigate }: HomePageProps) {
  const tasks = sortTasks(data.tasks.filter((task) => task.day === selectedDay))
  const stats = calculatePeriodStats(data.tasks, data.completions, [selectedDate])
  const streak = getStreak(data)
  const isToday = new Date().toDateString() === selectedDate.toDateString()
  const { current, next } = getCurrentAndNext(data.tasks.filter((task) => !isCompleted(data.completions, selectedDate, task.id)), selectedDay, nowMinutes())
  const focus = isToday ? current ?? next : tasks.find((task) => !isCompleted(data.completions, selectedDate, task.id))
  const dateLabel = isToday ? 'اليوم' : DAYS[selectedDay]

  return (
    <div className="page-stack home-page">
      <section className="welcome-block">
        <div>
          <p className="date-line">{formatArabicDate(selectedDate)}</p>
          <h1>{data.settings.displayName ? `أهلًا ${data.settings.displayName}،` : 'أهلًا بك،'} <span>لنرتّب يومك بهدوء.</span></h1>
          <p>ابدأ بما هو أمامك الآن، واترك لكل مهمة وقتها.</p>
        </div>
        <button type="button" className="primary-button add-main" onClick={() => onAdd(true)}><CalendarPlus size={19} /> إضافة سريعة</button>
      </section>

      <DayStrip selectedDay={selectedDay} onSelect={onSelectDay} today={new Date()} />

      <section className="focus-panel">
        <div className="focus-copy">
          <span className="section-kicker"><Clock3 size={16} /> {current && isToday ? 'المهمة الحالية' : 'المهمة التالية'}</span>
          {focus ? (
            <>
              <h2>{focus.title}</h2>
              <p>{formatTime(focus.start)} — {formatTime(focus.end)} · {DAYS[focus.day]}</p>
              <button type="button" className="text-action" onClick={() => onToggle(focus)}>{isCompleted(data.completions, selectedDate, focus.id) ? <Circle size={18} /> : <CheckCircle2 size={18} />}{isCompleted(data.completions, selectedDate, focus.id) ? 'إلغاء الإنجاز' : 'تسجيل إنجاز المهمة'}</button>
            </>
          ) : (
            <><h2>لا توجد مهام متبقية</h2><p>{stats.total ? 'أنجزت كل ما كان مخططًا لهذا اليوم.' : 'يمكنك إضافة مهمة أو ترك هذا اليوم للراحة.'}</p></>
          )}
        </div>
        <div className="focus-progress"><ProgressRing value={stats.percentage} /><span>{stats.completed} من {stats.total} مهام</span></div>
      </section>

      <div className="home-layout">
        <section className="content-section schedule-preview">
          <div className="section-heading">
            <div><span className="section-kicker">الخط الزمني</span><h2>جدول {dateLabel}</h2></div>
            <button type="button" className="text-action" onClick={() => onNavigate('schedule')}>إدارة الجدول <ArrowLeft size={17} /></button>
          </div>
          <TaskList tasks={tasks} allTasks={data.tasks} selectedDate={selectedDate} completions={data.completions} onToggle={onToggle} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} emptyAction={() => onAdd(false)} showActions={false} />
        </section>

        <aside className="home-aside">
          <section className="plain-section">
            <div className="section-heading compact"><h2>ملخص {dateLabel}</h2></div>
            <div className="metric-list">
              <div><span>المهام المتبقية</span><strong>{stats.remaining}</strong></div>
              <div><span>الوقت المخطط</span><strong>{Math.round(stats.plannedMinutes / 60 * 10) / 10} س</strong></div>
              <div><span>سلسلة الالتزام</span><strong><Flame size={18} /> {streak.current} يوم</strong></div>
            </div>
            <p className="micro-note">لا تدخل فترات النوم والراحة في نسبة الإنجاز.</p>
          </section>
          <section className="plain-section">
            <div className="section-heading compact"><h2>وصول سريع</h2></div>
            <div className="shortcut-list">
              <button type="button" onClick={() => onNavigate('meals')}><Utensils size={20} /><span><strong>الوجبات</strong><small>مواعيدك وروابط مساعدي الغذائي</small></span><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => onNavigate('goals')}><Target size={20} /><span><strong>الأهداف</strong><small>تابع تقدمك الأسبوعي</small></span><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => onNavigate('notes')}><NotebookPen size={20} /><span><strong>الملاحظات</strong><small>احفظ فكرة قبل أن تفلت</small></span><ArrowLeft size={17} /></button>
              <button type="button" className="emergency-shortcut" onClick={() => onNavigate('emergency')}><Sparkles size={20} /><span><strong>مخرج الطوارئ</strong><small>أعد ترتيب يومك دون فوضى</small></span><ArrowLeft size={17} /></button>
            </div>
          </section>
          <section className="tip-line"><Lightbulb size={19} /><p>المحاضرات المتداخلة مع العمل تظهر مستقلة، لكنها لا تضاعف الوقت المشغول في التقارير.</p></section>
        </aside>
      </div>
    </div>
  )
}
