interface ProgressRingProps {
  value: number
  size?: number
  label?: string
}

export function ProgressRing({ value, size = 104, label = 'إنجاز اليوم' }: ProgressRingProps) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const safeValue = Math.min(100, Math.max(0, value))
  return (
    <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${safeValue}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle className="ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - safeValue / 100)} />
      </svg>
      <strong>{safeValue}<small>%</small></strong>
    </div>
  )
}
