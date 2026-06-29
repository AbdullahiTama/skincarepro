import { useState, useEffect } from 'react'
import { getClients, addClient, updateClient } from '../../lib/supabase'
import { fmt, todayDate } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, Textarea, GhostBtn, TealBtn, Avatar, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Clients({ brand, role, perms }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const c = await getClients(brand.id); setClients(c || []) } catch (e) {}
    setLoading(false)
  }

  async function save() {
    if (!form.fullName || !form.phone) { alert('Please enter client name and phone number.'); return }
    setSaving(true)
    try {
      await addClient({
        business_id: brand.id,
        full_name: form.fullName,
        phone: form.phone,
        email: form.email || '',
        address: form.address || '',
        date_of_birth: form.dob || '',
        gender: form.gender || '',
        notes: form.notes || '',
        total_spend: 0,
        visit_count: 0,
      })
      showToast('Client added!')
      setForm({}); setShowAdd(false); load()
    } catch (e) { alert('Error saving client.') }
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const thisMonth = new Date().toISOString().slice(0, 7)
  const newThisMonth = clients.filter(c => c.created_at?.startsWith(thisMonth)).length
  const totalSpend = clients.reduce((s, c) => s + (c.total_spend || 0), 0)

  return (
    <div>
      <SectionHead title='Clients' sub='All your client and patient records' btn='+ Add Client' onBtn={() => setShowAdd(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='👥' label='Total Clients' value={clients.length} />
        <StatCard icon='🆕' label='New This Month' value={newThisMonth} />
        <StatCard icon='💰' label='Total Lifetime Spend' value={fmt(totalSpend)} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search by name, phone or email...'
          style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='👥' message={search ? 'No clients match your search' : 'No clients yet. Add your first client!'} action='+ Add Client' onAction={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(c => (
            <Card key={c.id} style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setSelected(c)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Avatar name={c.full_name} size={44} bg='linear-gradient(135deg,#8b5cf6,#a78bfa)' />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{c.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.phone || 'No phone'}{c.email ? ' · ' + c.email : ''}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{c.gender || ''}{c.date_of_birth ? ' · DOB: ' + c.date_of_birth : ''}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f766e' }}>{fmt(c.total_spend || 0)}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{c.visit_count || 0} visit(s)</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({}) }} title='Add New Client'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({}) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Add Client'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Inp label='Full Name *' value={form.fullName} onChange={v => f('fullName', v)} placeholder='Client full name' required />
          <Inp label='Phone Number *' value={form.phone} onChange={v => f('phone', v)} placeholder='08012345678' required />
          <Inp label='Email' value={form.email} onChange={v => f('email', v)} type='email' placeholder='client@email.com' />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Date of Birth' value={form.dob} onChange={v => f('dob', v)} type='date' />
            <Sel label='Gender' value={form.gender} onChange={v => f('gender', v)} options={['Male', 'Female', 'Other']} />
          </div>
          <Inp label='Address' value={form.address} onChange={v => f('address', v)} placeholder='Home address' />
          <Textarea label='Notes' value={form.notes} onChange={v => f('notes', v)} placeholder='Any notes about this client...' rows={2} />
        </div>
      </Modal>

      {/* Client Detail Modal */}
      <Modal show={!!selected} onClose={() => setSelected(null)} title='Client Details'>
        {selected && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', borderRadius: '12px', background: '#f9fafb' }}>
              <Avatar name={selected.full_name} size={56} bg='linear-gradient(135deg,#8b5cf6,#a78bfa)' />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{selected.full_name}</div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{selected.phone}</div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <div><div style={{ fontSize: '18px', fontWeight: '900', color: '#0f766e' }}>{fmt(selected.total_spend || 0)}</div><div style={{ fontSize: '11px', color: '#aaa' }}>Total Spent</div></div>
                  <div><div style={{ fontSize: '18px', fontWeight: '900' }}>{selected.visit_count || 0}</div><div style={{ fontSize: '11px', color: '#aaa' }}>Visits</div></div>
                </div>
              </div>
            </div>
            {[['Email', selected.email || '—'], ['Gender', selected.gender || '—'], ['Date of Birth', selected.date_of_birth || '—'], ['Address', selected.address || '—'], ['Notes', selected.notes || '—'], ['Joined', selected.created_at?.split('T')[0] || '—']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f9f9f9', fontSize: '13px' }}>
                <span style={{ color: '#888', fontWeight: '600' }}>{l}</span>
                <span style={{ color: '#0f172a', textAlign: 'right', maxWidth: '240px' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
