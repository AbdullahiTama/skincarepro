import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getTodaySales, getSales } from '../../lib/supabase'
import { fmt, businessIcon, businessName, TEAL, TEALC, DARK } from '../../lib/utils'
import { Card, StatCard } from '../../components/ui'

export default function DashboardHome({ brand, products, role, perms }) {
  const navigate = useNavigate()
  const [todaySales, setTodaySales] = useState([])
  const [creditCount, setCreditCount] = useState(0)
  const bType = brand?.business_type || brand?.type || 'skincare'
  const isHospital = bType === 'hospital'

  useEffect(() => {
    if (brand?.id) {
      getTodaySales(brand.id).then(s => setTodaySales(s || [])).catch(() => {})
      getSales(brand.id).then(s => setCreditCount((s || []).filter(x => x.is_credit && x.balance > 0).length)).catch(() => {})
    }
  }, [brand?.id])

  const todayTotal = todaySales.reduce((s, x) => s + (x.total || 0), 0)
  const lowStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5)).length
  const outStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock <= 0).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Welcome banner */}
      <div style={{ borderRadius: '20px', padding: '24px', color: 'white', backgroundImage: DARK, position: 'relative', overflow: 'hidden' }}>
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
        </div>
      </div>

      {/* Today's summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
        <StatCard icon='💰' label="Today's Revenue" value={fmt(todayTotal)} sub={todaySales.length + ' transactions'} onClick={() => navigate('/dashboard/pos')} />
        <StatCard icon='📦' label='Total Products' value={products.length} sub={lowStock + ' low stock'} alert={outStock > 0} onClick={() => navigate('/dashboard/inventory')} />
        <StatCard icon='💳' label='Credit Pending' value={creditCount} alert={creditCount > 0} onClick={() => navigate('/dashboard/pos')} />
        <StatCard icon='🔍' label='On CareFind' value={products.filter(p => p.list_on_carefind !== false && p.stock > 0).length} onClick={() => navigate('/dashboard/carefind')} />
      </div>

      {/* Quick actions */}
      {isHospital ? (
        <div style={{ padding: '20px', borderRadius: '16px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px', color: '#0f172a' }}>Hospital Patient Flow</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[['👩‍💼', 'Reception', 'reception'], ['→', '', ''], ['🏥', 'Triage', 'triage'], ['→', '', ''], ['👨‍⚕️', 'Doctor', 'doctor'], ['→', '', ''], ['💊', 'Pharmacy', 'rx_inbox']].map((item, i) => (
              item[0] === '→' ? <span key={i} style={{ color: '#aaa', fontSize: '18px' }}>→</span> : (
                <div key={i} onClick={() => navigate('/dashboard/' + item[2])}
                  style={{ padding: '12px 16px', borderRadius: '12px', background: 'white', border: '1px solid #ccfbf1', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item[0]}</div>
                  <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>{item[1]}</div>
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

      {/* Low stock alert */}
      {lowStock > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div><div style={{ fontWeight: '700', color: '#92400e' }}>{lowStock} product(s) running low on stock</div><div style={{ fontSize: '12px', color: '#b45309' }}>{outStock > 0 ? outStock + ' are completely out of stock' : 'Restock soon'}</div></div>
          </div>
          <button onClick={() => navigate('/dashboard/inventory')} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#d97706', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>View</button>
        </div>
      )}
    </div>
  )
}
