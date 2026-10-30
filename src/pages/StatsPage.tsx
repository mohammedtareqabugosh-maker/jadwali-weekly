import { useState } from 'react'
import { CheckCircle2, Flame, Target, Utensils } from 'lucide-react'
import type { AppData } from '../types'
import { calculatePeriodStats, getStreak } from '../lib/stats'
import { formatDuration, weekDates } from '../lib/time'

export function StatsPage({ data, selectedDate }: { data: AppData; selectedDate: Date }) {
  const [period, setPeriod] = useState<'day' | 'week'>('day')
  const dates = period === 'day' ? [selectedDate] : weekDates(selectedDate)
  const stats = calculatePeriodStats(data.tasks, data.completions, dates)
  const streak = getStreak(data)
  const achievedGoals = data.goals.filter((goal) => goal.status === 'completed' || goal.current >= goal.target).length
  const categories = [
    { key: 'work' as const, label: 'العمل' },
    { key: 'university' as const, label: 'الجامعة' },
    { key: 'online' as const, label: 'المحاضرات أونلاين' },
    { key: 'study' as const, label: 'المذاكرة الذاتية' },
  ]
  const maxMinutes = Math.max(1, ...categories.map(({ key }) => stats.categoryMinutes[key].planned))
  return <div className="page-stack">
    <section className="page-heading"><div><span className="section-kicker">أرقام من جدولك الفعلي</span><h1>الإحصائيات والتقارير</h1><p>الساعات المنجزة تقدير مبني على مدد المهام المعلّمة كمكتملة، وليست تتبعًا زمنيًا فعليًا.</p></div><div className="segmented-control"><button type="button" className={period === 'day' ? 'active' : ''} onClick={() => setPeriod('day')}>اليوم</button><button type="button" className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>الأسبوع</button></div></section>
    <div className="stats-overview"><article><span>نسبة الإنجاز</span><strong>{stats.percentage}%</strong><small>{stats.completed} مكتملة · {stats.remaining} متبقية</small></article><article><span>الوقت المخطط</span><strong>{formatDuration(stats.plannedMinutes)}</strong><small>للمهام الداخلة في الإنجاز</small></article><article><span>الوقت المشغول</span><strong>{formatDuration(stats.occupiedMinutes)}</strong><small>بعد دمج التداخلات</small></article><article><span>الالتزام</span><strong><Flame size={24} /> {streak.current}</strong><small>أفضل سلسلة: {streak.best} يوم</small></article></div>
    <section className="content-section"><div className="section-heading"><div><h2>توزيع الساعات</h2><p>لكل فئة على حدة؛ لذلك لا تُجمع المحاضرة داخل العمل مرة أخرى في الوقت المشغول الكلي.</p></div></div><div className="category-chart">{categories.map(({ key, label }) => { const values = stats.categoryMinutes[key]; return <div className="chart-row" key={key}><div><strong>{label}</strong><span>{formatDuration(values.planned)}</span></div><div className="chart-track" aria-label={`${label}: ${formatDuration(values.planned)} مخطط، ${formatDuration(values.completed)} منجز`}><span className="chart-planned" style={{ width: `${values.planned / maxMinutes * 100}%` }} /><span className="chart-completed" style={{ width: `${values.planned ? values.completed / maxMinutes * 100 : 0}%` }} /></div><small>المنجز التقديري: {formatDuration(values.completed)}</small></div>})}</div><div className="chart-legend"><span><i className="planned" /> مخطط</span><span><i className="completed" /> منجز تقديري</span></div></section>
    <div className="secondary-stats"><article><CheckCircle2 size={21} /><div><strong>{stats.completed} / {stats.total}</strong><span>المهام المكتملة</span></div></article><article><Utensils size={21} /><div><strong>{stats.mealsTotal ? Math.round(stats.mealsCompleted / stats.mealsTotal * 100) : 0}%</strong><span>الالتزام بالوجبات ({stats.mealsCompleted}/{stats.mealsTotal})</span></div></article><article><Target size={21} /><div><strong>{achievedGoals} / {data.goals.length}</strong><span>الأهداف المكتملة</span></div></article></div>
  </div>
}
