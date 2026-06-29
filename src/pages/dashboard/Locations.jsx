import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { useNavigate } from 'react-router-dom'
import { getAllLocations, addBranch, getSales, getTodaySales, getProducts } from '../../lib/supabase'
import { fmt, todayDate, TEAL, TEALC, DARK, businessIcon, businessName, NIG_STATES } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, GhostBtn, TealBtn, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Locations({ brand, role }) {
  const { auth, setAuth } = useAuth()
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const isOwner = role === 'Owner'
  const mainId = brand?.parent_business_id || brand?.id

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try {
      const locs = await getAllLocations(brand.id)
      setLocations(locs || [])
      // Get stats for each location
      const statsData = {}
      for (const loc of (locs || [])) {
        try {
          const [today, products] = await Promise.all([
            getTodaySales(loc.id),
            getProducts(loc.id),
          ])
          statsData[loc.id] = {
            todayRevenue: (today || []).reduce((s, x) => s + (x.total || 0), 0),
            todayCount: (today || []).length,
            productCount: (products || []).length,
            lowStock: (products || []).filter(p => (p.cat || p.category) !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5)).length,
          }
        } catch (e) {
          statsData[loc.id] = { todayRevenue: 0, todayCount: 0, productCount: 0, lowStock: 0 }
        }
      }
      setStats(statsData)
    } catch (e) {}
    setLoading(false)
  }

  async function saveBranch() {
    if (!form.name || !form.address) { alert('Please enter branch name and address.'); return }
    setSaving(true)
    try {
      await addBranch({
        name: brand.name + ' — ' + form.name,
        branch_name: form.name,
        parent_business_id: mainId,
        owner: brand.owner,
        email: brand.email,
        password: brand.password,
        phone: form.phone || brand.phone,
        whatsapp: form.whatsapp || brand.whatsapp,
        address: form.address,
        state: form.state || brand.state,
        city: form.city || '',
        business_type: brand.business_type || brand.type,
        hours: brand.hours || '',
        status: 'active',
        visible_on_carefind: true,
        plan: brand.plan || 'growth',
      })
      showToast('Branch added successfully!')
      setForm({}); setShowAdd(false); load()
    } catch (e) { alert('Error adding branch.') }
    setSaving(false)
  }

  function switchToLocation(loc) {
    const newAuth = { ...auth, brand: loc }
    setAuth(newAuth)
    try { localStorage.setItem('carehub_auth', JSON.stringify(newAuth)) } catch (e) {}
    showToast('Switched to ' + (loc.branch_name || loc.name))
    setTimeout(() => navigate('/dashboard/dashboard'), 500)
  }

  const totalRevenue = Object.values(stats).reduce((s, x) => s + (x.todayRevenue || 0), 0)
  const totalTransactions = Object.values(stats).reduce((s, x) => s + (x.todayCount || 0), 0)
  const totalProducts = Object.values(stats).reduce((s, x) => s + (x.productCount || 0), 0)
  const totalLowStock = Object.values(stats).reduce((s, x) => s + (x.lowStock || 0), 0)

  if (!isOwner) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: '#555' }}>Multi-location management is restricted to the business Owner</div>
    </div>
  )

  return (
    <div>
      <SectionHead title='Locations' sub='Manage all your business branches in one place' btn='+ Add Branch' onBtn={() => setShowAdd(true)} />

      {/* Combined stats across all locations */}
      <div style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: DARK, color: 'white' }}>
        <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '12px' }}>📊 Combined Performance — All Locations Today</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#14b8a6' }}>{fmt(totalRevenue)}</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Total Revenue</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>{totalTransactions}</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Transactions</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>{locations.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Locations</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: totalLowStock > 0 ? '#fbbf24' : 'white' }}>{totalLowStock}</div>
            <div style={{ fontSize: '11px', opacity: 0.5 }}>Low Stock Items</div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : locations.length === 0 ? (
        <Empty icon='🏢' message='No additional branches yet' action='+ Add First Branch' onAction={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {locations.sort((a, b) => (a.parent_business_id ? 1 : -1)).map(loc => {
            const isCurrentLocation = loc.id === brand.id
            const isMain = !loc.parent_business_id
            const s = stats[loc.id] || {}
            return (
              <Card key={loc.id} style={{ padding: '18px', border: isCurrentLocation ? '2px solid #14b8a6' : '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isMain ? '#f0fdfa' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {isMain ? '🏢' : businessIcon(loc.business_type || loc.type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px' }}>{loc.branch_name || (isMain ? 'Main Location' : loc.name)}</span>
                        {isMain && <Pill label='Main' type='blue' />}
                        {isCurrentLocation && <Pill label='Current' type='green' />}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{loc.address || 'No address set'}{loc.state ? ', ' + loc.state : ''}</div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: '700' }}>💰 {fmt(s.todayRevenue || 0)} today</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>📦 {s.productCount || 0} products</span>
                        {s.lowStock > 0 && <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700' }}>⚠️ {s.lowStock} low stock</span>}
                      </div>
                    </div>
                  </div>
                  {!isCurrentLocation && (
                    <TealBtn onClick={() => switchToLocation(loc)} style={{ padding: '8px 16px', fontSize: '12px' }}>Switch to this branch →</TealBtn>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({}) }} title='Add New Branch'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({}) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={saveBranch} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Add Branch'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdfa', fontSize: '12px', color: '#0f766e' }}>
            This branch will use the same login email and password as your main account. Inventory, sales, and staff are separate per branch.
          </div>
          <Inp label='Branch Name *' value={form.name} onChange={v => f('name', v)} placeholder='e.g. Lagos Branch, Abuja Branch' required />
          <Inp label='Branch Address *' value={form.address} onChange={v => f('address', v)} placeholder='Full address of this branch' required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Sel label='State' value={form.state} onChange={v => f('state', v)} options={NIG_STATES} />
            <Inp label='City' value={form.city} onChange={v => f('city', v)} placeholder='e.g. Ikeja' />
          </div>
          <Inp label='Branch Phone' value={form.phone} onChange={v => f('phone', v)} placeholder='Phone number for this branch' />
          <Inp label='Branch WhatsApp' value={form.whatsapp} onChange={v => f('whatsapp', v)} placeholder='WhatsApp for this branch' />
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
