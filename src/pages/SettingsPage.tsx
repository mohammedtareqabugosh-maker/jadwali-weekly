import { useRef, useState } from 'react'
import { Download, HardDrive, Info, Moon, Smartphone, Sun, Upload } from 'lucide-react'
import type { AppData, Settings } from '../types'
import { downloadBackup, parseBackupFile } from '../lib/storage'

interface SettingsPageProps {
  data: AppData
  onSettings: (settings: Settings) => void
  onReplace: (data: AppData) => void
  canInstall: boolean
  onInstall: () => void
}

export function SettingsPage({ data, onSettings, onReplace, canInstall, onInstall }: SettingsPageProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [candidate, setCandidate] = useState<AppData | null>(null)
  const [message, setMessage] = useState('')
  const chooseFile = async (file?: File) => {
    if (!file) return
    setMessage('جارٍ التحقق من الملف…')
    try { setCandidate(await parseBackupFile(file)); setMessage('الملف صالح. راجع الملخص قبل الاستبدال.') } catch (error) { setCandidate(null); setMessage(error instanceof Error ? error.message : 'تعذر استيراد الملف.') }
    if (fileRef.current) fileRef.current.value = ''
  }
  return <div className="page-stack">
    <section className="page-heading"><div><span className="section-kicker">جهازك، بياناتك، اختياراتك</span><h1>الإعدادات</h1><p>خصّص التطبيق وأدر نسخك الاحتياطية وتثبيته على الشاشة الرئيسية.</p></div></section>
    <section className="settings-section"><div className="settings-title"><Sun size={21} /><div><h2>التخصيص</h2><p>تُحفظ هذه الإعدادات مع بياناتك المحلية.</p></div></div><div className="settings-body"><label className="field-label">الاسم في رسالة الترحيب<input className="field" value={data.settings.displayName} onChange={(event) => onSettings({ ...data.settings, displayName: event.target.value })} maxLength={80} placeholder="اختياري" /></label><label className="field-label">معيار يوم الالتزام<div className="range-line"><input type="range" min="10" max="100" step="5" value={data.settings.streakTarget} onChange={(event) => onSettings({ ...data.settings, streakTarget: Number(event.target.value) })} /><strong>{data.settings.streakTarget}%</strong></div><span className="field-hint">يُحتسب اليوم ملتزمًا عند بلوغ هذه النسبة من المهام الداخلة في الإنجاز. اليوم الجاري لا يكسر السلسلة قبل اكتماله.</span></label><div className="field-label">مظهر التطبيق<div className="segmented-control theme-control"><button type="button" className={data.settings.theme === 'light' ? 'active' : ''} onClick={() => onSettings({ ...data.settings, theme: 'light' })}><Sun size={17} /> فاتح</button><button type="button" className={data.settings.theme === 'dark' ? 'active' : ''} onClick={() => onSettings({ ...data.settings, theme: 'dark' })}><Moon size={17} /> داكن</button></div></div></div></section>
    <section className="settings-section"><div className="settings-title"><HardDrive size={21} /><div><h2>النسخ الاحتياطي والاستعادة</h2><p>لديك {data.tasks.length} مهمة و{data.notes.length} ملاحظة و{data.goals.length} أهداف.</p></div></div><div className="settings-body"><div className="backup-actions"><button type="button" className="primary-button" onClick={() => downloadBackup(data)}><Download size={18} /> تصدير كل البيانات</button><button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><Upload size={18} /> استيراد نسخة</button><input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={(event) => chooseFile(event.target.files?.[0])} /></div>{message && <p className="form-message" role="status">{message}</p>}{candidate && <div className="restore-preview"><strong>ملخص النسخة الجديدة</strong><p>{candidate.tasks.length} مهمة · {candidate.goals.length} هدف · {candidate.notes.length} ملاحظة · {Object.keys(candidate.completions).length} سجل إنجاز</p><p>سيحل هذا محل البيانات الحالية على هذا المتصفح. صدّر نسخة حالية أولًا إن احتجتها.</p><div className="form-actions"><button type="button" className="danger-button" onClick={() => { onReplace(candidate); setCandidate(null); setMessage('تمت استعادة النسخة بنجاح.') }}>تأكيد استبدال البيانات</button><button type="button" className="secondary-button" onClick={() => { setCandidate(null); setMessage('أُلغي الاستيراد؛ بقيت بياناتك الحالية دون تغيير.') }}>إلغاء</button></div></div>}<p className="micro-note"><Info size={15} /> حذف بيانات المتصفح أو استخدام متصفح آخر قد يمنع الوصول إلى بياناتك. الاستيراد يتحقق من كامل الملف قبل أي استبدال.</p></div></section>
    <section className="settings-section"><div className="settings-title"><Smartphone size={21} /><div><h2>التثبيت كتطبيق PWA</h2><p>افتح التطبيق مرة مع اتصال بالإنترنت ليتمكن من تخزين ملفاته للعمل لاحقًا دون اتصال.</p></div></div><div className="settings-body install-body">{canInstall && <button type="button" className="primary-button" onClick={onInstall}><Smartphone size={18} /> تثبيت التطبيق</button>}<div><h3>على iPhone عبر Safari</h3><ol><li>افتح التطبيق في Safari.</li><li>اضغط زر «مشاركة».</li><li>اختر «إضافة إلى الشاشة الرئيسية».</li></ol><p>قد تختلف بعض سلوكيات PWA بحسب إصدار iOS والمتصفح. لا يتضمن التطبيق إشعارات أو مزامنة سحابية.</p></div></div></section>
  </div>
}
