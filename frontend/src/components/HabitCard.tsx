import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, localToday } from '../api/client'
import type { Habit } from '../api/client'
import WeeklyRate from './WeeklyRate'

interface Props {
  habit: Habit
  onUpdated: (habit: Habit) => void
  onDeleted: (id: number) => void
}

export default function HabitCard({ habit, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(habit.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBuild = habit.type === 'build'

  async function action() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.post<{ habit: Habit }>(
        `/api/habits/${habit.id}/${isBuild ? 'complete' : 'relapse'}`,
        { date: localToday(), today: localToday() },
      )
      onUpdated(res.habit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.put<{ habit: Habit }>(`/api/habits/${habit.id}`, {
        name: name.trim(),
        today: localToday(),
      })
      onUpdated(res.habit)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete habit "${habit.name}"?`)) return
    setBusy(true)
    try {
      await api.del(`/api/habits/${habit.id}`)
      onDeleted(habit.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const stats = habit.stats
  const streak = isBuild ? stats.build?.currentStreak ?? 0 : stats.break?.cleanStreak ?? 0

  return (
    <div className={`card habit-card ${isBuild ? 'build' : 'break'}`}>
      <div className="habit-header">
        {editing ? (
          <form onSubmit={saveEdit} className="inline-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
            <button className="btn btn-small" type="submit" disabled={busy}>
              Save
            </button>
            <button className="btn btn-small btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h3>{habit.name}</h3>
            <span className={`badge badge-${habit.type}`}>{habit.type}</span>
          </>
        )}
        <div className="habit-actions">
          {!editing && (
            <button className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          <button className="btn btn-small btn-danger" onClick={remove} disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      <div className="streak">
        {isBuild ? 'Current streak' : 'Clean streak'}
        <span className="streak-value">{streak}</span>
        {streak === 1 ? 'day' : 'days'}
      </div>

      {isBuild && stats.build && <WeeklyRate weekly={stats.build.weekly} />}
      {!isBuild && stats.break && (
        <div className="relapse-info">
          {stats.break.lastRelapse ? (
            <span>Last relapse: {stats.break.lastRelapse}</span>
          ) : (
            <span>No relapses recorded yet</span>
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <button className="btn btn-primary btn-block" onClick={action} disabled={busy}>
        {busy ? '…' : isBuild ? 'Mark completed for today' : 'Record relapse'}
      </button>
    </div>
  )
}