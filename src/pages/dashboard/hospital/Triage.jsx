// Triage.jsx
import { useState, useEffect } from 'react'
import { getPatients, addTriage, updatePatient, getTriage } from '../../../lib/supabase'
import { Card, SectionHead, Inp, Textarea, GhostBtn, TealBtn, Avatar, Loading, Empty, Pill, useToast, Toast } from '../../../components/ui'

function StatusBadge({ status }) {
  const map = { at_triage: { label: 'At Triage', type: 'amber' }, at_doctor: { label: 'With Doctor', type: 'purple' }, at_pharmacy: { label: 'At Pharmacy', type: 'teal' }, discharged: { label: 'Discharged', type: 'green' } }
  const s = map[status] || { label: status || '—', type: 'gray' }
  return <Pill label={s.label} type={s.type} />
}

export default function Triage({ brand }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const p = await getPatients(brand.id); setPatients((p || []).filter(x => x.status === 'at_triage')) } catch (e) {}
    setLoading(false)
  }

  async function sendToDoctor() {
    if (!selected) return
    setSaving(true)
    try {
      await addTriage({ patient_id: selected.id, business_id: brand.id, weight: form.weight || '', height: form.height || '', bp: form.bp || '', pulse: form.pulse || '', temperature: form.temp || '', rr: form.rr || '', spo2: form.spo2 || '', blood_sugar: form.bs || '', chief_complaint: form.complaint || '', allergies: form.allergies || '', nurse_name: form.nurseName || '', status: 'done' })
      await updatePatient(selected.id, { status: 'at_doctor' })
      setDone(true); load()
    } catch (e) { alert('Error saving triage. Please try again.') }
    setSaving(false)
  }

  if (selected && !done) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setSelected(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <div><div style={{ fontWeight: '900', fontSize: '18px' }}>Triage — {selected.full_name}</div><div style={{ fontSize: '12px', color: '#aaa' }}>{selected.reg_no} · {selected.department || 'General OPD'}</div></div>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '16px' }}>
        🏥 Nurse Module — Vitals saved here go directly to the Doctor
      </div>
      <Card style={{ padding: '16px', marginBottom: '14px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e', marginBottom: '8px' }}>Patient Info — From Reception</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[['Name', selected.full_name], ['Phone', selected.phone], ['DOB', selected.date_of_birth || '—'], ['Gender', selected.gender || '—'], ['Department', selected.department || '—'], ['Doctor', selected.assigned_doctor || '—'], ['Insurance', selected.insurance || '—'], ['Payment', selected.pay_status || '—']].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700' }}>{l}</div><div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{v}</div></div>
          ))}
        </div>
      </Card>
      <Card style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Vital Signs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Inp label='Weight (kg)' value={form.weight} onChange={v => f('weight', v)} placeholder='e.g. 68' />
          <Inp label='Height (cm)' value={form.height} onChange={v => f('height', v)} placeholder='e.g. 170' />
          <Inp label='Blood Pressure' value={form.bp} onChange={v => f('bp', v)} placeholder='e.g. 120/80 mmHg' />
          <Inp label='Pulse (bpm)' value={form.pulse} onChange={v => f('pulse', v)} placeholder='e.g. 72' />
          <Inp label='Temperature (°C)' value={form.temp} onChange={v => f('temp', v)} placeholder='e.g. 37.2' />
          <Inp label='Respiratory Rate' value={form.rr} onChange={v => f('rr', v)} placeholder='e.g. 16/min' />
          <Inp label='Oxygen Saturation' value={form.spo2} onChange={v => f('spo2', v)} placeholder='e.g. 98%' />
          <Inp label='Blood Sugar (optional)' value={form.bs} onChange={v => f('bs', v)} placeholder='e.g. 5.6 mmol/L' />
        </div>
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Textarea label='Chief Complaint' value={form.complaint} onChange={v => f('complaint', v)} placeholder="Patient's main complaint in brief..." rows={2} />
          <Textarea label='Allergies (if any)' value={form.allergies} onChange={v => f('allergies', v)} placeholder='Known allergies...' rows={2} />
          {form.allergies && <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>⚠️ ALLERGY ALERT: {form.allergies}</div>}
          <Inp label='Nurse Name' value={form.nurseName} onChange={v => f('nurseName', v)} placeholder='Your name' />
        </div>
      </Card>
      <button onClick={sendToDoctor} disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : 'Save Vitals & Send to Doctor →'}
      </button>
      <Toast msg={msg} />
    </div>
  )

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Triage Complete!</div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Vitals saved for <strong>{selected.full_name}</strong></div>
      <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '13px', color: '#7c3aed', fontWeight: '700', marginBottom: '24px' }}>
        🔔 Patient sent to Doctor — Doctor can now see full file
      </div>
      <div><TealBtn onClick={() => { setSelected(null); setDone(false); setForm({}); load() }}>Back to Patient List</TealBtn></div>
    </div>
  )

  return (
    <div>
      <SectionHead title='Triage' sub='Patients waiting for nurse assessment' />
      {loading ? <Loading /> : patients.length === 0 ? (
        <Empty icon='🏥' message='No patients at triage right now' />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {patients.map(p => (
            <Card key={p.id} style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={p.full_name} size={44} />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{p.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.reg_no} · {p.phone}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.department || 'General OPD'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <StatusBadge status={p.status} />
                <TealBtn onClick={() => { setSelected(p); setForm({}); setDone(false) }}>Start Triage</TealBtn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Toast msg={msg} />
    </div>
  )
}
