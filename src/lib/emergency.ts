import type { ReplanProposal, Task } from '../types'
import { durationMinutes, fromMinutes, mergeBusyIntervals, nowMinutes, toMinutes } from './time'

export interface EmergencyOption {
  id: string
  label: string
  next: string
}

export interface EmergencyNode {
  id: string
  text: string
  options: EmergencyOption[]
  tone?: 'normal' | 'safety'
}

export const EMERGENCY_NODES: Record<string, EmergencyNode> = {
  start: {
    id: 'start',
    text: 'واضح أن يومك لم يسر حسب الخطة. ما المشكلة الأساسية؟',
    options: [
      { id: 'wake', label: 'تأخرت في الاستيقاظ', next: 'delay' },
      { id: 'work', label: 'تأخرت في العمل أو الجامعة', next: 'delay' },
      { id: 'long', label: 'أخذت وقتًا أطول في مهمة', next: 'task_finished' },
      { id: 'phone', label: 'ضيعت وقتًا على الهاتف', next: 'phone_time' },
      { id: 'tired', label: 'أشعر بالتعب وأحتاج إلى الراحة', next: 'energy' },
      { id: 'other', label: 'لدي مشكلة أخرى', next: 'safety_check' },
    ],
  },
  delay: {
    id: 'delay',
    text: 'كم مقدار التأخير تقريبًا؟ سننظر إلى المتبقي فقط دون لمس المواعيد الثابتة.',
    options: [
      { id: 'short', label: 'أقل من 30 دقيقة', next: 'fixed_check' },
      { id: 'medium', label: 'من 30 إلى 90 دقيقة', next: 'fixed_check' },
      { id: 'long', label: 'أكثر من 90 دقيقة', next: 'fixed_check' },
    ],
  },
  task_finished: {
    id: 'task_finished',
    text: 'هل المهمة التي استغرقت وقتًا أطول انتهت؟',
    options: [
      { id: 'yes', label: 'نعم، انتهت', next: 'fixed_check' },
      { id: 'no', label: 'لا، تحتاج وقتًا إضافيًا', next: 'extra_time' },
    ],
  },
  extra_time: {
    id: 'extra_time',
    text: 'كم تحتاج لإكمالها؟ اختر تقديرًا واقعيًا لا مثاليًا.',
    options: [
      { id: '15', label: '15 دقيقة', next: 'fixed_check' },
      { id: '30', label: '30 دقيقة', next: 'fixed_check' },
      { id: '60', label: 'ساعة أو أكثر', next: 'fixed_check' },
    ],
  },
  phone_time: {
    id: 'phone_time',
    text: 'لا حاجة للوم نفسك. هل تستطيع بدء خطوة قصيرة الآن؟',
    options: [
      { id: 'yes', label: 'نعم، أبدأ بـ10 دقائق', next: 'fixed_check' },
      { id: 'break', label: 'أحتاج استراحة قصيرة أولًا', next: 'energy' },
    ],
  },
  energy: {
    id: 'energy',
    text: 'الراحة جزء من الخطة. ما الأنسب لطاقتك الحالية؟',
    options: [
      { id: 'rest20', label: 'راحة 20 دقيقة ثم مراجعة الجدول', next: 'fixed_check' },
      { id: 'light', label: 'مهمة خفيفة فقط', next: 'fixed_check' },
      { id: 'stop', label: 'إنهاء المهام غير الضرورية اليوم', next: 'fixed_check' },
    ],
  },
  fixed_check: {
    id: 'fixed_check',
    text: 'هل يوجد موعد ثابت قريب يجب الحفاظ عليه؟ سيُحفظ تلقائيًا في الاقتراح.',
    options: [
      { id: 'yes', label: 'نعم، حافظ على المواعيد الثابتة', next: 'plan' },
      { id: 'no', label: 'لا يوجد، رتّب المتبقي', next: 'plan' },
    ],
  },
  plan: {
    id: 'plan',
    text: 'راجعت مهامك المتبقية والفترات المتاحة. هذه خطة بديلة لن تُطبق إلا بموافقتك.',
    options: [],
  },
  safety_check: {
    id: 'safety_check',
    text: 'هل المشكلة تنظيم وقت فقط، أم يوجد خطر مباشر أو حالة طارئة حقيقية؟',
    options: [
      { id: 'time', label: 'مشكلة تنظيم وقت', next: 'delay' },
      { id: 'danger', label: 'يوجد خطر أو حالة طارئة', next: 'safety' },
    ],
  },
  safety: {
    id: 'safety',
    tone: 'safety',
    text: 'توقف عن تعديل الجدول الآن. إذا كان هناك خطر مباشر، انتقل إلى مكان آمن وتواصل مع شخص موثوق قريب منك أو مع خدمات الطوارئ المحلية في بلدك. التطبيق لا يتصل بالطوارئ ولا يعمل بديلًا عن المساعدة البشرية أو الطبية.',
    options: [{ id: 'restart', label: 'العودة إلى مساعد تنظيم الوقت', next: 'start' }],
  },
}

export interface ReplanResult {
  proposals: ReplanProposal[]
  unscheduled: Task[]
  message: string
}

export function buildReplan(tasks: Task[], day: number, completedTaskIds: string[], from = nowMinutes()): ReplanResult {
  const dayTasks = tasks.filter((task) => task.day === day)
  const movable = dayTasks.filter((task) => !completedTaskIds.includes(task.id) && !task.fixed && task.type !== 'rest' && task.type !== 'sleep')
  const anchored = dayTasks.filter((task) => !movable.some((item) => item.id === task.id))
  const busy: Array<[number, number]> = mergeBusyIntervals(anchored, from)
  const proposals: ReplanProposal[] = []
  const unscheduled: Task[] = []

  for (const task of movable.sort((a, b) => toMinutes(a.start) - toMinutes(b.start))) {
    const duration = durationMinutes(task.start, task.end)
    let cursor = from
    let placed: [number, number] | null = null
    const sortedBusy = [...busy].sort((a, b) => a[0] - b[0])
    for (const [start, end] of sortedBusy) {
      if (start - cursor >= duration) {
        placed = [cursor, cursor + duration]
        break
      }
      cursor = Math.max(cursor, end)
    }
    if (!placed && 1440 - cursor >= duration) placed = [cursor, cursor + duration]
    if (!placed) {
      unscheduled.push(task)
      continue
    }
    busy.push(placed)
    proposals.push({
      taskId: task.id,
      title: task.title,
      oldStart: task.start,
      oldEnd: task.end,
      newStart: fromMinutes(placed[0]),
      newEnd: fromMinutes(placed[1]),
      reason: task.fixed ? 'موعد ثابت' : 'فترة متاحة لا تتعارض مع المواعيد الثابتة أو الراحة.',
    })
  }

  const message = proposals.length
    ? unscheduled.length
      ? 'وجدنا أماكن لبعض المهام، لكن لا توجد فترة كافية للبقية. يمكنك تأجيلها أو تقسيمها يدويًا.'
      : 'هذا ترتيب بديل للمهام المرنة فقط؛ لم يتغير أي موعد ثابت أو فترة راحة.'
    : 'لا توجد فترة مناسبة في بقية اليوم. أجّل مهمة أو قسّمها، ولا تحذف مواعيدك تلقائيًا.'
  return { proposals, unscheduled, message }
}

export function applyReplan(tasks: Task[], proposals: ReplanProposal[]): Task[] {
  return tasks.map((task) => {
    const proposal = proposals.find((item) => item.taskId === task.id)
    return proposal ? { ...task, start: proposal.newStart, end: proposal.newEnd } : task
  })
}
