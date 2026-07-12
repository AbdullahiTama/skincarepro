import { useState, useEffect } from 'react'
import { getStaff, addStaff, updateStaff, deleteStaff, getStaffClaims, approveStaffClaim, rejectStaffClaim } from '../../lib/supabase'
import { emailStaffWelcome } from '../../lib/email'
import { ROLE_LIST } from '../../lib/permissions'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, GhostBtn, TealBtn, RedBtn, Avatar, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Staff({ brand, role, perms }) {
  const [staff, setStaff] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const isOwner = role === 'Owner'
  const bType = brand?.business_type || brand?.type
  const isEnterprise = bType === 'manufacturer_importer' || bType === 'wholesale'

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try {
      const s = await getStaff(brand.id)
      setStaff(s || [])
    } catch (e) {}
    try {
      const c = await getStaffClaims(brand.id)
      setClaims(c || [])
    } catch (e) {}
    setLoading(false)
  }

  // Every role already used at this company — becomes the suggestion list,
  // so the company's own hierarchy naturally builds itself as they add people.
  const usedRoles = [...new Set(staff.map(s => s.role).filter(Boolean))]

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
        show_on_carefind: form.showOnCareFind || false,
        public_title: form.publicTitle || form.role,
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

  async function toggleCareFind(s) {
    try { await updateStaff(s.id, { show_on_carefind: !s.show_on_carefind }); load(); showToast(!s.show_on_carefind ? 'Now visible on CareFind' : 'Hidden from CareFind') } catch (e) {}
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this staff member? They will lose access immediately.')) return
    try { await deleteStaff(id); load(); showToast('Staff removed.') } catch (e) {}
  }

  async function handleApproveClaim(claimId) {
    try { await approveStaffClaim(claimId); load(); showToast('Claim approved!') } catch (e) { alert('Error approving claim.') }
  }

  async function handleRejectClaim(claimId) {
    if (!window.confirm('Reject this claim?')) return
    try { await rejectStaffClaim(claimId); load(); showToast('Claim rejected.') } catch (e) { alert('Error rejecting claim.') }
  }

  const roleColor = r => ({ Owner: 'purple', Manager: 'blue', Doctor: 'teal', Pharmacist: 'teal', Nurse: 'teal' }[r] || 'gray')

  return (
    <div>
      <SectionHead title={isEnterprise ? 'Sales Team' : 'Staff Management'} sub='Manage your team and their access levels'
        btn={isOwner ? '+ Add Staff Member' : undefined} onBtn={isOwner ? () => setShowAdd(true) : undefined} />

      {!isOwner && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '20px', fontSize: '13px', color: '#92400e' }}>
          ⚠️ Only the business Owner can add or remove staff members.
        </div>
      )}

      {isOwner && claims.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
            🔔 Pending CareFind Claims ({claims.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {claims.map(c => (
              <Card key={c.id} style={{ padding: '14px', border: '1px solid #fcd34d', background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>{c.staff?.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>
                      wants to claim <strong>{c.staff?.public_title || 'their position'}</strong> on CareFind
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApproveClaim(c.id)}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#0f766e', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => handleRejectClaim(c.id)}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
                  {s.public_title && <div style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600', marginTop: '2px' }}>{s.public_title}</div>}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <Pill label={s.role} type={roleColor(s.role)} />
                    <Pill label={s.status === 'active' ? 'Active' : 'Inactive'} type={s.status === 'active' ? 'green' : 'gray'} />
                    {s.show_on_carefind && <Pill label='On CareFind' type='teal' />}
                  </div>
                </div>
              </div>
              {isOwner && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => toggleCareFind(s)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: s.show_on_carefind ? '#fffbeb' : '#f0fdfa', color: s.show_on_carefind ? '#d97706' : '#0f766e', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    {s.show_on_carefind ? 'Hide from CareFind' : 'Show on CareFind'}
                  </button>
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

          {isEnterprise ? (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '6px' }}>Role *</div>
              <input
                list='enterprise-role-suggestions'
                value={form.role || ''}
                onChange={e => f('role', e.target.value)}
                placeholder='e.g. Regional Manager, Medical Rep — type your own'
                style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <datalist id='enterprise-role-suggestions'>
                {usedRoles.map(r => <option key={r} value={r} />)}
              </datalist>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                {usedRoles.length > 0 ? 'Start typing to reuse a role you\'ve already created, or type a new one.' : 'Type any role name — your team structure is entirely up to you.'}
              </div>
            </div>
          ) : (
            <Sel label='Role *' value={form.role} onChange={v => f('role', v)} options={ROLE_LIST} required />
          )}

          <Inp label='Password *' value={form.password} onChange={v => f('password', v)} type='password' placeholder='Set a password for them' required />

          <div style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type='checkbox' checked={form.showOnCareFind || false} onChange={e => f('showOnCareFind', e.target.checked)} style={{ marginTop: '2px' }} />
              <span>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Show this person on CareFind</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>They can claim this position on CareFind and post, respond to reviews, and add products on the company's behalf.</div>
              </span>
            </label>
            {form.showOnCareFind && (
              <div style={{ marginTop: '10px' }}>
                <Inp label='Public Title' value={form.publicTitle} onChange={v => f('publicTitle', v)} placeholder='e.g. Regional Manager (defaults to their role if left blank)' />
              </div>
            )}
          </div>

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
