import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { Goal, Habit } from '../api/client'

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [habitId, setHabitId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<{ goals: Goal[] }>('/api/goals'),
      api.get<{ habits: Habit[] }>('/api/habits'),
    ])
      .then(([goalsRes, habitsRes]) => {
        setGoals(goalsRes.goals)
        setHabits(habitsRes.habits)
        if (habitsRes.habits.length > 0) setHabitId(String(habitsRes.habits[0].id))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  async function createGoal(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post<{ goal: Goal }>('/api/goals', {
        title,
        description: description || undefined,
        habitId: Number(habitId),
      })
      setGoals((prev) => [res.goal, ...prev])
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id)
    setEditTitle(goal.title)
    setEditDescription(goal.description ?? '')
  }

  async function saveEdit(goal: Goal) {
    setError(null)
    try {
      const res = await api.put<{ goal: Goal }>(`/api/goals/${goal.id}`, {
        title: editTitle,
        description: editDescription,
      })
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.goal : g)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  async function removeGoal(id: number) {
    if (!window.confirm('Delete this goal?')) return
    try {
      await api.del(`/api/goals/${id}`)
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
    }
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="dashboard">
      <h1>Goals</h1>
      <p className="muted">Goals are linked to a habit — build or break.</p>
      {error && <div className="error">{error}</div>}

      <form onSubmit={createGoal} className="form create-habit">
        <input
          placeholder="Goal title, e.g. Read 20 minutes daily"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={habitId} onChange={(e) => setHabitId(e.target.value)} required>
          {habits.length === 0 && <option value="">No habits yet</option>}
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.type})
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={submitting || habits.length === 0}>
          {submitting ? 'Adding…' : 'Add goal'}
        </button>
      </form>

      {goals.length === 0 ? (
        <p className="muted">No goals yet. Create one above.</p>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => (
            <div key={goal.id} className="card goal-card">
              {editingId === goal.id ? (
                <div className="goal-edit">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                  <button className="btn btn-small" onClick={() => saveEdit(goal)}>
                    Save
                  </button>
                  <button className="btn btn-small btn-ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="goal-body">
                    <strong>{goal.title}</strong>
                    {goal.description && <p className="muted">{goal.description}</p>}
                    <span className={`badge badge-${goal.habit_type}`}>
                      {goal.habit_name} · {goal.habit_type}
                    </span>
                  </div>
                  <div className="habit-actions">
                    <button className="btn btn-small btn-ghost" onClick={() => startEdit(goal)}>
                      Edit
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => removeGoal(goal.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}