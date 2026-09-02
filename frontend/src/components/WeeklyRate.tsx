import type { BuildStats } from '../api/client'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  weekly: BuildStats['weekly']
}

export default function WeeklyRate({ weekly }: Props) {
  const days: { label: string; date: string; completed: boolean }[] = []
  let cursor = weekly.weekStart
  for (let i = 0; i < 7; i += 1) {
    days.push({
      label: DAY_LABELS[i],
      date: cursor,
      completed: weekly.completedDays.includes(cursor),
    })
    const d = new Date(`${cursor}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + 1)
    cursor = d.toISOString().slice(0, 10)
  }

  return (
    <div className="weekly">
      <div className="weekly-days">
        {days.map((d) => (
          <div key={d.date} className="weekly-day">
            <span className={`dot ${d.completed ? 'dot-done' : ''}`} />
            <span className="weekly-label">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="weekly-summary">
        {weekly.missedThisWeek > 0 ? (
          <span className="warn">Missed {weekly.missedThisWeek} day{weekly.missedThisWeek === 1 ? '' : 's'} this week</span>
        ) : (
          <span className="ok">No missed days this week</span>
        )}
      </div>
    </div>
  )
}