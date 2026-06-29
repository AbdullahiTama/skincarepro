import { useState, useEffect } from 'react'
import { getPatients, getTriage, addConsultation, addPrescription, updatePatient } from '../../../lib/supabase'
import { fmt } from '../../../lib/utils'
import { Card, SectionHead, Inp, Sel, Textarea, GhostBtn, TealBtn, Avatar, Loading, Empty, Pill, useToast, Toast } from '../../../components/ui'

export default function Doctor({ brand, products }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [triageData, setTriageData] = useState(null)
  const [consult, setConsult] = useState({})
  const [meds, setMeds] = useState([])
  const [medSearch, setMedSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const { msg, show: showToast } = useToast()
  const c = (k, v) => setConsult(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const p = await getPatients(brand.id); setPatients((p || []).filter(x => x.status === 'at_doctor')) } catch (e) {}
    setLoading(false)
  }

  async function openPatient(p) {
    setSelected(p); setConsult({}); setMeds([]); setDone(false); setSentTo('')
    try { const t = await getTriage(p.id); setTriageData(t) } catch (e) {}
  }

  const medicines = (products || []).filter(p => (p.cat || p.category) === 'Medicines' && (p.name.toLowerCase().includes(medSearch.toLowerCase()) || (p.generic_name || '').toLowerCase().includes(medSearch.toLowerCase())))
  const addMed = m => { setMeds(prev => [...prev, { ...m, dose: '', freq: '', dur: '', route: 'Oral', instructions: '' }]); setMedSearch('') }
  const updMed = (i, k, v) => setMeds(prev => prev.map((m, j) => j === i ? { ...m, [k]: v } : m))

  async function sendToPharmacy() {
    if (!consult.dx1) { alert('Please enter at least a primary diagnosis.'); return }
    setSaving(true)
    try {
      const c = await addConsultation({ patient_id: selected.id, business_id: brand.id, hpi: consult.hpi || '', examination: consult.exam || '', primary_diagnosis: consult.dx1 || '', secondary_diagnosis: consult.dx2 || '', clinical_notes: consult.notes || '', disposition: consult.disposition || 'Discharge', referral_dest: consult.refDest || '', referral_reason: consult.refReason || '', ward: consult.ward || '', counselling: consult.counselling || '', doctor_name: consult.doctorName || '', status: 'completed' })
      if (meds.length > 0 || consult.labTests || consult.imaging) {
        await addPrescription({ patient_id: selected.id, consultation_id: (c[0] || {}).id || null, business_id: brand.id, patient_name: selected.full_name, doctor_name: consult.doctorName || '', medicines: JSON.stringify(meds), lab_tests: consult.labTests || '', imaging: consult.imaging || '', notes: consult.prescNotes || '', status: 'pending' })
      }
      const nextStatus = meds.length > 0 ? 'at_pharmacy' : 'discharged'
      await updatePatient(selected.id, { status: nextStatus })
      setSentTo(nextStatus); setDone(true); load()
    } catch (e) { alert('Error saving consultation.') }
    setSaving(false)
  }

  if (selected && !done) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setSelected(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <div><div style={{ fontWeight: '900', fontSize: '18px' }}>Doctor Consultation</div><div style={{ fontSize: '12px', color: '#aaa' }}>{selected.full_name} · {selected.reg_no}</div></div>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '12px', color: '#7c3aed', fontWeight: '600', marginBottom: '14px' }}>
        👨‍⚕️ Patient info auto-filled from Reception and Triage
      </div>
      <Card style={{ padding: '14px', marginBottom: '14px', background: '#fafafa' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '10px' }}>Patient Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          {[['Name', selected.full_name], ['Reg No.', selected.reg_no], ['Gender', selected.gender || '—'], ['DOB', selected.date_of_birth || '—'], ['Department', selected.department || '—'], ['Doctor', selected.assigned_doctor || '—'], ['Insurance', selected.insurance || '—']].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700' }}>{l}</div><div style={{ fontSize: '12px', fontWeight: '600' }}>{v}</div></div>
          ))}
        </div>
        {triageData && (
          <>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>Vitals from Nurse</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                {[['BP', triageData.bp], ['Pulse', triageData.pulse], ['Temp', triageData.temperature], ['SpO2', triageData.spo2], ['Weight', triageData.weight], ['Height', triageData.height]].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} style={{ padding: '5px 8px', borderRadius: '7px', background: 'white', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700' }}>{l}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700' }}>{v}</div>
                  </div>
                ))}
              </div>
              {triageData.chief_complaint && <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '7px', background: 'white', border: '1px solid #f0f0f0', fontSize: '12px' }}><strong>Chief Complaint:</strong> {triageData.chief_complaint}</div>}
              {triageData.allergies && <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '7px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>⚠️ ALLERGY: {triageData.allergies}</div>}
            </div>
          </>
        )}
      </Card>
      <Card style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Clinical Assessment</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Textarea label='History of Present Illness' value={consult.hpi} onChange={v => c('hpi', v)} placeholder='Onset, duration, severity, progression, associated symptoms...' rows={4} />
          <Textarea label='Physical Examination Findings' value={consult.exam} onChange={v => c('exam', v)} placeholder='General appearance, systemic examination...' rows={3} />
          <Inp label='Primary Diagnosis *' value={consult.dx1} onChange={v => c('dx1', v)} placeholder='e.g. Hypertensive crisis, Malaria, Peptic Ulcer Disease' required />
          <Inp label='Secondary Diagnosis (optional)' value={consult.dx2} onChange={v => c('dx2', v)} placeholder='Additional diagnosis...' />
          <Textarea label='Clinical Notes' value={consult.notes} onChange={v => c('notes', v)} placeholder='Additional observations...' rows={2} />
          <Inp label='Doctor Name' value={consult.doctorName} onChange={v => c('doctorName', v)} placeholder='Your name' />
        </div>
      </Card>
      <Card style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Prescription — Sends to Pharmacy</div>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder='Search medicines from inventory...'
            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          {medSearch && medicines.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', overflow: 'hidden' }}>
              {medicines.map(m => (
                <button key={m.id} onClick={() => addMed(m)} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontWeight: '700', fontSize: '13px' }}>{m.emoji} {m.name}</div><div style={{ fontSize: '11px', color: '#888' }}>{m.generic_name || ''} · {m.stock} in stock</div></div>
                  <span style={{ color: '#0f766e', fontWeight: '700', fontSize: '12px' }}>+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {meds.length === 0 ? <div style={{ textAlign: 'center', padding: '14px', color: '#ddd', fontSize: '13px', border: '1px dashed #e5e7eb', borderRadius: '10px' }}>Search and add medicines above</div>
          : meds.map((med, idx) => (
            <div key={idx} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '10px', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>{med.emoji} {med.name}</div>
                <button onClick={() => setMeds(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: '700', fontSize: '12px' }}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Inp label='Dose' value={med.dose} onChange={v => updMed(idx, 'dose', v)} placeholder='e.g. 500mg' />
                <Inp label='Frequency' value={med.freq} onChange={v => updMed(idx, 'freq', v)} placeholder='e.g. Twice daily' />
                <Inp label='Duration' value={med.dur} onChange={v => updMed(idx, 'dur', v)} placeholder='e.g. 5 days' />
                <Sel label='Route' value={med.route} onChange={v => updMed(idx, 'route', v)} options={['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Other']} />
              </div>
              <div style={{ marginTop: '8px' }}><Inp label='Instructions' value={med.instructions} onChange={v => updMed(idx, 'instructions', v)} placeholder='e.g. Take after meals' /></div>
            </div>
          ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
          <Textarea label='Lab Tests Ordered' value={consult.labTests} onChange={v => c('labTests', v)} placeholder='FBC, LFT, Malaria RDT...' rows={2} />
          <Textarea label='Imaging Requested' value={consult.imaging} onChange={v => c('imaging', v)} placeholder='Chest X-ray, USS...' rows={2} />
        </div>
      </Card>
      <Card style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Disposition & Follow-up</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {['Discharge', 'Admit', 'Refer to Specialist', 'Emergency Transfer'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: '1px solid ' + (consult.disposition === v ? '#0f766e' : '#e5e7eb'), background: consult.disposition === v ? '#f0fdfa' : 'white', cursor: 'pointer', fontSize: '13px' }}>
              <input type='radio' checked={consult.disposition === v} onChange={() => c('disposition', v)} style={{ accentColor: '#0f766e' }} />{v}
            </label>
          ))}
        </div>
        {consult.disposition === 'Admit' && <Inp label='Ward / Bed' value={consult.ward} onChange={v => c('ward', v)} placeholder='e.g. Male Medical Ward, Bed 5' />}
        {consult.disposition === 'Refer to Specialist' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <Inp label='Referral Destination' value={consult.refDest} onChange={v => c('refDest', v)} placeholder='e.g. LUTH Cardiology' />
          <Textarea label='Reason' value={consult.refReason} onChange={v => c('refReason', v)} rows={2} />
        </div>}
        <Textarea label='Patient Counselling & Instructions' value={consult.counselling} onChange={v => c('counselling', v)} placeholder='Diet, lifestyle, medication compliance...' rows={2} />
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Inp label='Follow-up Date' value={consult.fuDate} onChange={v => c('fuDate', v)} type='date' />
          <Sel label='Follow-up Clinic' value={consult.fuClinic} onChange={v => c('fuClinic', v)} options={['Same Doctor', 'General OPD', 'Cardiology', 'Pediatrics', 'Surgery', 'Other']} />
        </div>
      </Card>
      <button onClick={sendToPharmacy} disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : meds.length > 0 ? 'Save & Send Prescription to Pharmacy →' : 'Save Consultation & Discharge →'}
      </button>
      <Toast msg={msg} />
    </div>
  )

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Consultation Saved!</div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Patient: <strong>{selected.full_name}</strong></div>
      {sentTo === 'at_pharmacy' ? (
        <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '13px', color: '#0f766e', fontWeight: '700', marginBottom: '24px' }}>
          💊 Prescription sent to Pharmacy inbox
        </div>
      ) : (
        <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', color: '#059669', fontWeight: '700', marginBottom: '24px' }}>
          ✅ Patient discharged successfully
        </div>
      )}
      <div><TealBtn onClick={() => { setSelected(null); setDone(false); setTriageData(null); load() }}>Back to Patient List</TealBtn></div>
    </div>
  )

  return (
    <div>
      <SectionHead title='Doctor Consultation' sub='Patients waiting to see doctor' />
      {loading ? <Loading /> : patients.length === 0 ? (
        <Empty icon='👨‍⚕️' message='No patients waiting for doctor' />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {patients.map(p => (
            <Card key={p.id} style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={p.full_name} size={44} bg='linear-gradient(135deg,#7c3aed,#a78bfa)' />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{p.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.reg_no} · {p.phone}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{p.department || 'General OPD'}{p.assigned_doctor ? ' · ' + p.assigned_doctor : ''}</div>
                </div>
              </div>
              <TealBtn onClick={() => openPatient(p)}>Open File</TealBtn>
            </Card>
          ))}
        </div>
      )}
      <Toast msg={msg} />
    </div>
  )
}
