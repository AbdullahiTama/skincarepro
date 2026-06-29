import { useState, useEffect } from 'react'
import { getPatients, addPatient, updatePatient } from '../../../lib/supabase'
import { todayDate, genId, NIG_STATES } from '../../../lib/utils'
import { Card, StatCard, SectionHead, Inp, Sel, GhostBtn, TealBtn, Avatar, Loading, Empty, Pill, useToast, Toast } from '../.././../components/ui'

function StatusBadge({ status }) {
  const map = {
    at_reception: { label: 'At Reception', type: 'blue' },
    at_triage: { label: 'At Triage', type: 'amber' },
    at_doctor: { label: 'With Doctor', type: 'purple' },
    at_pharmacy: { label: 'At Pharmacy', type: 'teal' },
    discharged: { label: 'Discharged', type: 'green' },
    admitted: { label: 'Admitted', type: 'red' },
  }
  const s = map[status] || { label: status || 'Unknown', type: 'gray' }
  return <Pill label={s.label} type={s.type} />
}

export default function Reception({ brand }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ regDate: todayDate(), regNo: genId('REG') })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const p = await getPatients(brand.id); setPatients(p || []) } catch (e) {}
    setLoading(false)
  }

  async function register() {
    if (!form.patName || !form.phone) { alert('Please enter patient name and phone number.'); return }
    setSaving(true)
    try {
      await addPatient({
        business_id: brand.id,
        reg_no: form.regNo,
        full_name: form.patName,
        date_of_birth: form.dob || '',
        gender: form.gender || '',
        phone: form.phone,
        address: form.address || '',
        next_of_kin: form.nokName || '',
        next_of_kin_phone: form.nokPhone || '',
        insurance: form.insurance || 'None',
        pay_status: form.payStatus || 'Pending',
        department: form.dept || '',
        assigned_doctor: form.doctor || '',
        status: 'at_triage',
      })
      setSaved(true)
      load()
    } catch (e) { alert('Error saving patient. Please try again.') }
    setSaving(false)
  }

  if (view === 'new' && !saved) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setView('list')} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <div><div style={{ fontWeight: '900', fontSize: '18px' }}>New Patient Registration</div><div style={{ fontSize: '12px', color: '#aaa' }}>Reception — data flows to Triage and Doctor automatically</div></div>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '12px', color: '#2563eb', fontWeight: '600', marginBottom: '16px' }}>
        👩‍💼 Data entered here will automatically appear for the Nurse and Doctor
      </div>
      <Card style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Patient Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Registration No.' value={form.regNo} onChange={v => f('regNo', v)} />
            <Inp label='Registration Date' value={form.regDate} onChange={v => f('regDate', v)} type='date' />
          </div>
          <Inp label='Full Name *' value={form.patName} onChange={v => f('patName', v)} placeholder='Patient full name' required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Date of Birth' value={form.dob} onChange={v => f('dob', v)} type='date' />
            <Sel label='Gender' value={form.gender} onChange={v => f('gender', v)} options={['Male', 'Female', 'Other']} />
          </div>
          <Inp label='Phone Number *' value={form.phone} onChange={v => f('phone', v)} placeholder='08012345678' required />
          <Inp label='Home Address' value={form.address} onChange={v => f('address', v)} placeholder='Full home address' />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Next of Kin Name' value={form.nokName} onChange={v => f('nokName', v)} placeholder='Full name' />
            <Inp label='Next of Kin Phone' value={form.nokPhone} onChange={v => f('nokPhone', v)} placeholder='Phone number' />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Sel label='Department' value={form.dept} onChange={v => f('dept', v)} options={['General OPD', 'Emergency', 'Cardiology', 'Pediatrics', 'Obstetrics', 'Surgery', 'Orthopedics', 'ENT', 'Ophthalmology', 'Dermatology', 'Psychiatry', 'Neurology', 'Other']} />
            <Inp label='Assigned Doctor' value={form.doctor} onChange={v => f('doctor', v)} placeholder='Dr. Name' />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Sel label='Insurance / HMO' value={form.insurance} onChange={v => f('insurance', v)} options={['None / Self-pay', 'NHIS', 'PHIS', 'Leadway', 'Aiico', 'Hygeia', 'Reliance', 'AXA Mansard', 'Other']} />
            <Sel label='Payment Status' value={form.payStatus} onChange={v => f('payStatus', v)} options={['Paid', 'Pending', 'Insurance', 'Waived']} />
          </div>
        </div>
      </Card>
      <button onClick={register} disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : 'Register Patient & Send to Triage →'}
      </button>
      <Toast msg={msg} />
    </div>
  )

  if (saved) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Patient Registered!</div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}><strong>{form.patName}</strong> has been registered successfully</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '13px', color: '#d97706', fontWeight: '700', marginBottom: '24px' }}>
        🔔 Patient sent to Triage — Nurse can now see this patient
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <TealBtn onClick={() => { setForm({ regDate: todayDate(), regNo: genId('REG') }); setSaved(false) }}>Register Another Patient</TealBtn>
        <GhostBtn onClick={() => { setSaved(false); setView('list') }}>Back to Patient List</GhostBtn>
      </div>
    </div>
  )

  return (
    <div>
      <SectionHead title='Reception' sub='Register patients and send to triage' btn='+ Register New Patient' onBtn={() => { setForm({ regDate: todayDate(), regNo: genId('REG') }); setSaved(false); setView('new') }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard icon='👥' label='Total Today' value={patients.length} />
        <StatCard icon='⏳' label='At Triage' value={patients.filter(p => p.status === 'at_triage').length} />
        <StatCard icon='✅' label='Discharged' value={patients.filter(p => p.status === 'discharged').length} />
      </div>
      {loading ? <Loading /> : patients.length === 0 ? <Empty icon='👥' message='No patients today' action='+ Register First Patient' onAction={() => setView('new')} /> : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #f5f5f5', background: '#fafafa' }}>
                {['Reg No.', 'Patient', 'Phone', 'Department', 'Doctor', 'Status'].map(h => <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{patients.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888', fontWeight: '600' }}>{p.reg_no}</td>
                  <td style={{ padding: '12px 14px' }}><div style={{ fontWeight: '700', fontSize: '13px' }}>{p.full_name}</div><div style={{ fontSize: '11px', color: '#aaa' }}>{p.gender || ''} {p.date_of_birth ? '· DOB: ' + p.date_of_birth : ''}</div></td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666' }}>{p.phone}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666' }}>{p.department || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666' }}>{p.assigned_doctor || '—'}</td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={p.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}
      <Toast msg={msg} />
    </div>
  )
}
