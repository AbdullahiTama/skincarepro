import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import BusinessDashboard from './pages/dashboard/BusinessDashboard'

// ── AUTH CONTEXT ──────────────────────────────────────────────────────────────
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('carehub_auth')
      return saved ? JSON.parse(saved) : null
    } catch (e) { return null }
  })

  const login = (brand, staff = null) => {
    const authData = { brand, staff, role: staff ? staff.role : 'Owner', loginTime: Date.now() }
    setAuth(authData)
    localStorage.setItem('carehub_auth', JSON.stringify(authData))
  }

  const logout = () => {
    setAuth(null)
    localStorage.removeItem('carehub_auth')
  }

  const isAdmin = () => auth?.isAdmin === true

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAdmin }}>
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={auth && !auth.isAdmin ? <Navigate to='/dashboard' /> : <Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/admin' element={auth?.isAdmin ? <AdminDashboard /> : <Navigate to='/login' />} />
          <Route path='/dashboard/*' element={auth && !auth.isAdmin ? <BusinessDashboard /> : <Navigate to='/login' />} />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  )
}
