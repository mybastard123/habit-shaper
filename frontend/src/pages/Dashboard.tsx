import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, localToday } from '../api/client'
import type { Habit, HabitType } from '../api/client'
import HabitCard from '../components/HabitCard'

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('build')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ habits: Habit[] }>(`/api/habits?today=${localToday()}`)
      .then((res) => setHabits(res.habits))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load habits'))
      .finally(() => setLoading(false))
  }, [])

  function updateHabit(updated: Habit) {
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
  }

  function deleteHabit(id: number) {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  async function createHabit(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const res = await api.post<{ habit: Habit }>('/api/habits', { name, type, today: localToday() })
      setHabits((prev) => [res.habit, ...prev])
      setName('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create habit')
    } finally {
      setCreating(false)
    }
  }

  const buildHabits = habits.filter((h) => h.type === 'build')
  const breakHabits = habits.filter((h) => h.type === 'break')

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="dashboard">
      <h1>Your habits</h1>
      {error && <div className="error">{error}</div>}

      <form onSubmit={createHabit} className="form create-habit">
        <input
          placeholder="Habit name, e.g. meditate"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value as HabitType)}>
          <option value="build">Build</option>
          <option value="break">Break</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add habit'}
        </button>
      </form>
      {createError && <div className="error">{createError}</div>}

      <section>
        <h2>Building</h2>
        {buildHabits.length === 0 ? (
          <p className="muted">No habits to build yet.</p>
        ) : (
          <div className="habit-grid">
            {buildHabits.map((h) => (
              <HabitCard key={h.id} habit={h} onUpdated={updateHabit} onDeleted={deleteHabit} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Breaking</h2>
        {breakHabits.length === 0 ? (
          <p className="muted">No habits to break yet.</p>
        ) : (
          <div className="habit-grid">
            {breakHabits.map((h) => (
              <HabitCard key={h.id} habit={h} onUpdated={updateHabit} onDeleted={deleteHabit} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}