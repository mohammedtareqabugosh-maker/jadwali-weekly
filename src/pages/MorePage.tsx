import { ArrowLeft, BarChart3, CloudOff, Database, NotebookPen, Settings, ShieldCheck, Sparkles } from 'lucide-react'
import type { View } from '../types'

export function MorePage({ onNavigate, online }: { onNavigate: (view: View) => void; online: boolean }) {
  const items: Array<{ view: View; title: string; description: string; icon: typeof Sparkles }> = [
    { view: 'emergency', title: 'مخرج الطوارئ', description: 'محادثة محلية لإعادة ترتيب بقية اليوم', icon: Sparkles },
    { view: 'notes', title: 'الملاحظات', description: 'أفكار وملاحظات مرتبطة بالأيام والمهام', icon: NotebookPen },
    { view: 'stats', title: 'الإحصائيات', description: 'تقارير يومية وأسبوعية من بياناتك الفعلية', icon: BarChart3 },
    { view: 'settings', title: 'الإعدادات والنسخ الاحتياطي', description: 'التخصيص والاستيراد والتصدير والتثبيت', icon: Settings },
  ]
  return <div className="page-stack"><section className="page-heading"><div><span className="section-kicker">أدواتك الإضافية</span><h1>المزيد</h1><p>كل الأدوات مرتبطة بالجدول نفسه، دون حساب أو خدمة خارجية.</p></div></section><div className="more-list">{items.map(({ view, title, description, icon: Icon }) => <button type="button" key={view} onClick={() => onNavigate(view)}><Icon size={23} /><span><strong>{title}</strong><small>{description}</small></span><ArrowLeft size={19} /></button>)}</div><section className="privacy-panel"><ShieldCheck size={24} /><div><h2>خصوصيتك أولًا</h2><p>تُحفظ بياناتك في IndexedDB داخل هذا المتصفح، ولا تُرفع تلقائيًا إلى أي خادم. استخدم النسخ الاحتياطي قبل حذف بيانات المتصفح.</p><span className={`connection-status ${online ? '' : 'offline'}`}>{online ? <Database size={16} /> : <CloudOff size={16} />}{online ? 'التخزين المحلي جاهز' : 'أنت غير متصل — الميزات المحلية متاحة'}</span></div></section></div>
}
