import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../App.jsx'
import { loginBusiness, loginStaff, getBusinessById } from '../../lib/supabase.js'
import { Card, Inp, TealBtn } from '../../components/ui/index.jsx'
import { TEAL, DARK } from '../../lib/utils.js'

const ADMIN_EMAIL = 'admin@carehub.ng'
const ADMIN_PASS = 'Admin@2025'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !pass) { setErr('Please enter your email and password.'); return }
    setLoading(true); setErr('')
    try {
      // Super admin
      if (email.toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASS) {
        const authData = { isAdmin: true, brand: null, staff: null, role: 'SuperAdmin' }
        localStorage.setItem('carehub_auth', JSON.stringify(authData))
        navigate('/admin')
        return
      }
      // Business owner
      const biz = await loginBusiness(email.toLowerCase(), pass)
      if (biz) {
        if (biz.status === 'pending') { setErr('Your account is pending admin approval. You will be notified once approved.'); setLoading(false); return }
        if (biz.status === 'suspended') { setErr('Your account has been suspended. Contact support@carehub.ng'); setLoading(false); return }
        login(biz, null)
        navigate('/dashboard/dashboard')
        return
      }
      // Staff member
      const staff = await loginStaff(email.toLowerCase(), pass)
      if (staff) {
        const biz2 = await getBusinessById(staff.business_id)
        if (biz2) {
          login(biz2, staff)
          navigate('/dashboard/dashboard')
          return
        }
      }
      setErr('Incorrect email or password. Please try again.')
    } catch (e) {
      setErr('Connection error. Check your internet and try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to='/' style={{ display: 'inline-block', marginBottom: '16px', color: '#888', fontSize: '13px', textDecoration: 'none' }}>← Back to Home</Link>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 12px' }}>🏥</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>CareHub</div>
          <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Sign in to your workspace</div>
        </div>

        <Card style={{ padding: '28px' }}>
          {err && <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>⚠️ {err}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Inp label='Email Address' value={email} onChange={setEmail} type='email' placeholder='your@email.com' required />
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>Password <span style={{ color: '#ef4444' }}>*</span></div>
              <div style={{ position: 'relative' }}>
                <input value={pass} onChange={e => setPass(e.target.value)} type={show ? 'text' : 'password'} placeholder='••••••••'
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '9px 44px 9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#aaa' }}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <TealBtn onClick={handleLogin} style={{ padding: '13px', fontSize: '15px', fontWeight: '900', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </TealBtn>
          </div>
        </Card>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>Don't have an account?</div>
          <Link to='/register' style={{ display: 'block', width: '100%', padding: '13px', borderRadius: '12px', border: '2px solid #0f766e', color: '#0f766e', fontWeight: '800', fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>
            ✍️ Register Your Business — Free
          </Link>
        </div>
      </div>
    </div>
  )
}
