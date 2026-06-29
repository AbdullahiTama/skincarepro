import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getTodaySales, getSales } from '../../lib/supabase'
import { fmt, businessIcon, businessName, TEAL, TEALC, DARK } from '../../lib/utils'
import { Card, StatCard } from '../../components/ui'

export default function DashboardHome({ brand, products, role, perms }) {
  const navigate = useNavigate()
  const [todaySales, setTodaySales] = useState([])
  const [creditCount, setCreditCount] = useState(0)
  const [showAllLow, setShowAllLow] = useState(false)
  const [showAllOut, setShowAllOut] = useState(false)
  const bType = brand?.business_type || brand?.type || 'skincare'
  const isHospital = bType === 'hospital'

  useEffect(() => {
    if (brand?.id) {
      getTodaySales(brand.id).then(s => setTodaySales(s || [])).catch(() => {})
      getSales(brand.id).then(s => setCreditCount((s || []).filter(x => x.is_credit && x.balance > 0).length)).catch(() => {})
    }
  }, [brand?.id])

  const todayTotal = todaySales.reduce((s, x) => s + (x.total || 0), 0)
  const lowStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5))
  const outStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock <= 0)
  const lowCount = lowStock.length
  const outCount = outStock.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* OUT OF STOCK ALERT — Always visible at top if any */}
      {outCount > 0 && (
        <div style={{ borderRadius: '16px', padding: '16px 20px', background: '#fef2f2', border: '2px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🔴</span>
              <div>
                <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '15px' }}>{outCount} product{outCount > 1 ? 's' : ''} OUT OF STOCK!</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>These products cannot be sold — restock immediately</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAllOut(s => !s)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: 'white', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                {showAllOut ? 'Hide' : 'View All'}
              </button>
              <button onClick={() => navigate('/dashboard/inventory')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                Restock →
              </button>
            </div>
          </div>
          {/* Show first 3 always */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(showAllOut ? outStock : outStock.slice(0, 3)).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'white', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{p.emoji || '📦'}</span>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#dc2626' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca' }}>0 units</span>
              </div>
            ))}
            {!showAllOut && outCount > 3 && (
              <button onClick={() => setShowAllOut(true)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                + {outCount - 3} more out of stock items
              </button>
            )}
          </div>
        </div>
      )}

      {/* LOW STOCK ALERT */}
      {lowCount > 0 && (
        <div style={{ borderRadius: '16px', padding: '16px 20px', background: '#fffbeb', border: '2px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🟡</span>
              <div>
                <div style={{ fontWeight: '800', color: '#d97706', fontSize: '15px' }}>{lowCount} product{lowCount > 1 ? 's' : ''} running low on stock!</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Order soon before they run out</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAllLow(s => !s)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fcd34d', background: 'white', color: '#d97706', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                {showAllLow ? 'Hide' : 'View All'}
              </button>
              <button onClick={() => navigate('/dashboard/inventory')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#d97706', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                Restock →
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(showAllLow ? lowStock : lowStock.slice(0, 3)).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'white', border: '1px solid #fcd34d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{p.emoji || '📦'}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>Reorder level: {p.reorder_level || 5} units</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#d97706' }}>{p.stock} left</div>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>units remaining</div>
                </div>
              </div>
            ))}
            {!showAllLow && lowCount > 3 && (
              <button onClick={() => setShowAllLow(true)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#d97706', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                + {lowCount - 3} more low stock items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Welcome banner */}
      <div style={{ borderRadius: '20px', padding: '24px', color: 'white', background: DARK, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)' }} />
        <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '4px' }}>Welcome back 👋</div>
        <div style={{ fontSize: '24px', fontWeight: '900' }}>{brand?.name}</div>
        <div style={{ fontSize: '13px', opacity: 0.5, marginTop: '4px' }}>{businessIcon(bType)} {businessName(bType)} · {role}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {(brand?.visible_on_carefind || brand?.visibleOnCareFind) && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(20,184,166,0.2)', fontSize: '11px', color: '#14b8a6', fontWeight: '700' }}>🔍 Live on CareFind</span>
          )}
          {creditCount > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(234,179,8,0.2)', fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>💳 {creditCount} credit sale(s) pending</span>
          )}
          {outCount > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(239,68,68,0.2)', fontSize: '11px', color: '#fca5a5', fontWeight: '700' }}>🔴 {outCount} out of stock</span>
          )}
          {lowCount > 0 && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(234,179,8,0.2)', fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>🟡 {lowCount} low stock</span>
          )}
        </div>
      </div>

      {/* Today's summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
        <StatCard icon='💰' label="Today's Revenue" value={fmt(todayTotal)} sub={todaySales.length + ' transactions'} onClick={() => navigate('/dashboard/pos')} />
        <StatCard icon='📦' label='Total Products' value={products.length} sub={lowCount + ' low · ' + outCount + ' out'} alert={outCount > 0} onClick={() => navigate('/dashboard/inventory')} />
        <StatCard icon='💳' label='Credit Pending' value={creditCount} alert={creditCount > 0} onClick={() => navigate('/dashboard/pos')} />
        <StatCard icon='🔍' label='On CareFind' value={products.filter(p => p.list_on_carefind !== false && p.stock > 0).length} onClick={() => navigate('/dashboard/carefind')} />
      </div>

      {/* Quick actions */}
      {isHospital ? (
        <div style={{ padding: '20px', borderRadius: '16px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px', color: '#0f172a' }}>Hospital Patient Flow</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[['👩‍💼', 'Reception', 'reception'], ['→', '', ''], ['🏥', 'Triage', 'triage'], ['→', '', ''], ['👨‍⚕️', 'Doctor', 'doctor'], ['→', '', ''], ['🔬', 'Lab', 'lab'], ['→', '', ''], ['🩻', 'Imaging', 'imaging'], ['→', '', ''], ['💊', 'Pharmacy', 'rx_inbox']].map((item, i) => (
              item[0] === '→' ? <span key={i} style={{ color: '#aaa', fontSize: '18px' }}>→</span> : (
                <div key={i} onClick={() => navigate('/dashboard/' + item[2])}
                  style={{ padding: '12px 16px', borderRadius: '12px', background: 'white', border: '1px solid #ccfbf1', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{item[0]}</div>
                  <div style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>{item[1]}</div>
                </div>
              )
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px' }}>
          {[['🛒', 'New Sale', '/dashboard/pos'], ['📅', 'Book Appt', '/dashboard/appointments'], ['👥', 'Add Client', '/dashboard/clients'], ['📦', 'Inventory', '/dashboard/inventory']].map(([icon, label, path]) => (
            <button key={label} onClick={() => navigate(path)}
              style={{ padding: '16px', borderRadius: '14px', border: '1px solid #f0f0f0', background: 'white', cursor: 'pointer', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontWeight: '700', fontSize: '12px', color: '#555' }}>{label}</div>
            </button>
          ))}
        </div>
      )}

      {/* All good message */}
      {outCount === 0 && lowCount === 0 && products.length > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div style={{ fontWeight: '700', color: '#059669', fontSize: '14px' }}>All products are well stocked!</div>
        </div>
      )}

    </div>
  )
}
