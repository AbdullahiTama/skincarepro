import { useState, useEffect } from 'react'
import { getStaff, addStaff, updateStaff, deleteStaff } from '../../lib/supabase'
import { emailStaffWelcome } from '../../lib/email'
import { ROLE_LIST } from '../../lib/permissions'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, GhostBtn, TealBtn, RedBtn, Avatar, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Staff({ brand, role, perms }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const isOwner = role === 'Owner'

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const s = await getStaff(brand.id); setStaff(s || []) } catch (e) {}
    setLoading(false)
  }

  async function save() {
    if (!form.fullName || !form.email || !form.password || !form.role) { alert('Please fill in all required fields.'); return }
    setSaving(true)
    try {
      await addStaff({
        business_id: brand.id,
        full_name: form.fullName,
        email: form.email.toLowerCase(),
        password: form.password,
        role: form.role,
        phone: form.phone || '',
        status: 'active',
      })
      // Send welcome email to staff
      try {
        await emailStaffWelcome({
          staffName: form.fullName,
          staffEmail: form.email,
          businessName: brand.name,
          role: form.role,
          password: form.password,
        })
      } catch (e) {}
      showToast('Staff member added! Welcome email sent.')
      setForm({}); setShowAdd(false); load()
    } catch (e) { alert('Error. Email may already be registered.') }
    setSaving(false)
  }

  async function toggleStatus(s) {
    try { await updateStaff(s.id, { status: s.status === 'active' ? 'inactive' : 'active' }); load(); showToast('Status updated!') } catch (e) {}
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this staff member? They will lose access immediately.')) return
    try { await deleteStaff(id); load(); showToast('Staff removed.') } catch (e) {}
  }

  const roleColor = r => ({ Owner: 'purple', Manager: 'blue', Doctor: 'teal', Pharmacist: 'teal', Nurse: 'teal' }[r] || 'gray')

  return (
    <div>
      <SectionHead title='Staff Management' sub='Manage your team and their access levels'
        btn={isOwner ? '+ Add Staff Member' : undefined} onBtn={isOwner ? () => setShowAdd(true) : undefined} />

      {!isOwner && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '20px', fontSize: '13px', color: '#92400e' }}>
          ⚠️ Only the business Owner can add or remove staff members.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard icon='👤' label='Total Staff' value={staff.length} />
        <StatCard icon='✅' label='Active' value={staff.filter(s => s.status === 'active').length} />
        <StatCard icon='⏸' label='Inactive' value={staff.filter(s => s.status !== 'active').length} />
      </div>

      {loading ? <Loading /> : staff.length === 0 ? (
        <Empty icon='👤' message='No staff added yet' action={isOwner ? '+ Add Staff Member' : undefined} onAction={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {staff.map(s => (
            <Card key={s.id} style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={s.full_name} size={44} bg='linear-gradient(135deg,#8b5cf6,#a78bfa)' />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{s.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.email}{s.phone ? ' · ' + s.phone : ''}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <Pill label={s.role} type={roleColor(s.role)} />
                    <Pill label={s.status === 'active' ? 'Active' : 'Inactive'} type={s.status === 'active' ? 'green' : 'gray'} />
                  </div>
                </div>
              </div>
              {isOwner && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toggleStatus(s)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: s.status === 'active' ? '#fffbeb' : '#f0fdf4', color: s.status === 'active' ? '#d97706' : '#059669', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    {s.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <RedBtn onClick={() => handleDelete(s.id)} style={{ padding: '6px 12px' }}>Remove</RedBtn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({}) }} title='Add Staff Member'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({}) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Add Staff'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Inp label='Full Name *' value={form.fullName} onChange={v => f('fullName', v)} placeholder='Staff full name' required />
          <Inp label='Email Address *' value={form.email} onChange={v => f('email', v)} type='email' placeholder='staff@yourbusiness.ng' required />
          <Inp label='Phone Number' value={form.phone} onChange={v => f('phone', v)} placeholder='08012345678' />
          <Sel label='Role *' value={form.role} onChange={v => f('role', v)} options={ROLE_LIST} required />
          <Inp label='Password *' value={form.password} onChange={v => f('password', v)} type='password' placeholder='Set a password for them' required />
          <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdfa', fontSize: '12px', color: '#0f766e', lineHeight: '1.7' }}>
            Staff log in with their email and this password. They will only see pages their role allows.
            <br />⚠️ <strong>Only Owner role</strong> can edit stock prices and delete records.
          </div>
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
