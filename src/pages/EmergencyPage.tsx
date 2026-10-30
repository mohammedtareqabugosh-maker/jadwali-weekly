import { useState } from 'react'
import { ArrowRight, Check, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import type { AppData, ReplanProposal } from '../types'
import { EMERGENCY_NODES, applyReplan, buildReplan, type EmergencyOption, type ReplanResult } from '../lib/emergency'
import { dateKey, formatTime, isCompleted, nowMinutes } from '../lib/time'

interface EmergencyPageProps {
  data: AppData
  selectedDay: number
  selectedDate: Date
  onApply: (tasks: AppData['tasks']) => void
}

interface HistoryItem { nodeId: string; answer?: EmergencyOption }

export function EmergencyPage({ data, selectedDay, selectedDate, onApply }: EmergencyPageProps) {
  const [history, setHistory] = useState<HistoryItem[]>([{ nodeId: 'start' }])
  const [applied, setApplied] = useState(false)
  const currentEntry = history.at(-1)!
  const node = EMERGENCY_NODES[currentEntry.nodeId]
  const completedIds = data.tasks.filter((task) => task.day === selectedDay && isCompleted(data.completions, selectedDate, task.id)).map((task) => task.id)
  const result: ReplanResult | null = node.id === 'plan' ? buildReplan(data.tasks, selectedDay, completedIds, nowMinutes()) : null
  const choose = (option: EmergencyOption) => { setApplied(false); setHistory((items) => [...items, { nodeId: option.next, answer: option }]) }
  const back = () => { if (history.length > 1) { setApplied(false); setHistory((items) => items.slice(0, -1)) } }
  const restart = () => { setApplied(false); setHistory([{ nodeId: 'start' }]) }
  const apply = (proposals: ReplanProposal[]) => { onApply(applyReplan(data.tasks, proposals)); setApplied(true) }

  return <div className="page-stack emergency-page">
    <section className="page-heading"><div><span className="section-kicker">مساعد محلي · يعمل دون إنترنت</span><h1>مخرج الطوارئ</h1><p>محادثة قائمة على قواعد واضحة، تقرأ مهامك المتبقية ولا تطبّق تغييرًا قبل موافقتك.</p></div><button type="button" className="secondary-button" onClick={restart}><RefreshCw size={18} /> محادثة جديدة</button></section>
    <div className="conversation-layout">
      <section className="conversation-panel" aria-live="polite">
        <div className="chat-history">{history.slice(0, -1).map((entry, index) => { const answer = history[index + 1]?.answer; return <div className="chat-pair" key={`${entry.nodeId}-${index}`}><div className="assistant-message">{EMERGENCY_NODES[entry.nodeId]?.text}</div>{answer && <div className="user-message">{answer.label}</div>}</div> })}</div>
        <div className={`assistant-message current-message ${node.tone === 'safety' ? 'safety-message' : ''}`}>{node.tone === 'safety' && <ShieldAlert size={22} />}<p>{node.text}</p></div>
        {node.id !== 'plan' ? <div className="answer-options">{node.options.map((option) => <button type="button" key={option.id} onClick={() => choose(option)}>{option.label}</button>)}</div> : <div className="replan-result">
          <p className="plan-message">{result?.message}</p>
          {result?.proposals.length ? <div className="proposal-list">{result.proposals.map((proposal) => <article key={proposal.taskId}><div><strong>{proposal.title}</strong><span>{formatTime(proposal.oldStart)} ← {formatTime(proposal.newStart)} — {formatTime(proposal.newEnd)}</span><small>{proposal.reason}</small></div></article>)}</div> : null}
          {result?.unscheduled.length ? <div className="unscheduled-box"><strong>لم تتسع هذه المهام:</strong><p>{result.unscheduled.map((task) => `${task.title}${task.allowSplit ? ' (يمكن تقسيمها)' : ' (يمكن تأجيلها)'}`).join('، ')}</p></div> : null}
          {result?.proposals.length ? <button type="button" className="primary-button" onClick={() => apply(result.proposals)} disabled={applied}>{applied ? <Check size={18} /> : <Sparkles size={18} />}{applied ? 'طُبّق الاقتراح' : `مراجعة وتطبيق ${result.proposals.length} تعديلات`}</button> : <button type="button" className="secondary-button" onClick={restart}>إعادة تقييم اليوم</button>}
          {applied && <p className="success-message" role="status">تم تحديث المهام المرنة فقط، وبقيت حالات الإنجاز والمواعيد الثابتة كما هي.</p>}
        </div>}
        <div className="conversation-controls"><button type="button" className="text-action" onClick={back} disabled={history.length <= 1}><ArrowRight size={17} /> السؤال السابق</button><span>الخطوة {history.length} · محادثة {dateKey(selectedDate)}</span></div>
      </section>
      <aside className="emergency-aside"><h2>ما الذي سيحدث؟</h2><ol><li>نستبعد المهام المنجزة.</li><li>نحافظ على المواعيد الثابتة وفترات الراحة والنوم.</li><li>نبحث عن فجوات تتسع للمدة كاملة.</li><li>نعرض الاقتراح أولًا، ثم تختار تطبيقه.</li></ol><p>إذا لم توجد فترة كافية، سنقول ذلك بوضوح بدل ضغط المهام أو تعديل مواعيد أخرى.</p></aside>
    </div>
  </div>
}
