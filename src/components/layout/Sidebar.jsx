import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../App'
import { getNavItems } from '../../lib/permissions'
import { businessIcon, businessName, DARK, TEAL, TEALC } from '../../lib/utils'
import NotificationBell from './NotificationBell'

export default function Sidebar({ brand, role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const bType = brand?.business_type || brand?.type || 'skincare'
  const navItems = getNavItems(role, bType)
  const current = location.pathname.split('/').pop() || 'dashboard'

  return (
    <div style={{ width: '210px', flexShrink: 0, backgroundImage: DARK, display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' }}>
      {/* Brand header */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
            {businessIcon(bType)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '12px', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brand?.name || 'CareHub'}
            </div>
            <div style={{ color: '#14b8a6', fontSize: '10px', marginTop: '2px' }}>
              {role || businessName(bType).split('/')[0].trim()}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px' }}>
        <div style={{ marginBottom: '6px' }}>
          <NotificationBell brand={brand} />
        </div>

        {navItems.map(([id, icon, label]) => {
          const active = current === id || (id === 'dashboard' && current === 'dashboard')
          return (
            <button key={id} onClick={() => navigate('/dashboard/' + id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', marginBottom: '1px', textAlign: 'left', background: active ? 'rgba(20,184,166,0.15)' : 'transparent', color: active ? '#14b8a6' : 'rgba(255,255,255,0.55)' }}>
              <span style={{ fontSize: '15px' }}>{icon}</span>
              {label}
              {id === 'carefind' && (brand?.visible_on_carefind || brand?.visibleOnCareFind) && (
                <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#14b8a6' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {brand?.email}
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
          → Sign Out
        </button>
      </div>
    </div>
  )
}
