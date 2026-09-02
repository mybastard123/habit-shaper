import { BrowserRouter, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'

function NavBar() {
  const { user, logout } = useAuth()
  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        Habit Shaper
      </Link>
      {user && (
        <div className="nav-links">
          <Link to="/">Habits</Link>
          <Link to="/goals">Goals</Link>
          <span className="nav-email">{user.email}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="loading">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading…</div>

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/goals"
        element={
          <RequireAuth>
            <Goals />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <main className="container">
          <AppRoutes />
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}