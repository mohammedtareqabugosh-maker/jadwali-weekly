import { DAYS_SHORT } from '../types'
import { dateKey, formatShortDate, weekDates } from '../lib/time'

interface DayStripProps {
  selectedDay: number
  onSelect: (day: number) => void
  today: Date
}

export function DayStrip({ selectedDay, onSelect, today }: DayStripProps) {
  const dates = weekDates(today)
  const todayKey = dateKey(today)
  return (
    <nav className="day-strip" aria-label="أيام الأسبوع">
      {DAYS_SHORT.map((day, index) => (
        <button
          type="button"
          key={day}
          className={`day-chip ${selectedDay === index ? 'selected' : ''} ${dateKey(dates[index]) === todayKey ? 'today' : ''}`}
          onClick={() => onSelect(index)}
          aria-pressed={selectedDay === index}
          aria-label={`${day} ${formatShortDate(dates[index])}`}
        >
          <span>{day}</span>
          <strong>{dates[index].getDate()}</strong>
        </button>
      ))}
    </nav>
  )
}
