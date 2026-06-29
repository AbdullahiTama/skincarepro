import { useState, useEffect } from 'react'
import { useAuth } from '../../../App'
import { getPatients, getTriage, addConsultation, addPrescription, updatePatient } from '../../../lib/supabase'
import { fmt, TEALC } from '../../../lib/utils'
import { Card, SectionHead, Inp, Sel, Textarea, GhostBtn, TealBtn, Avatar, Loading, Empty, Pill, useToast, Toast } from '../../../components/ui'

const SB_URL = 'https://szdybxmgmhndoytqanfb.supabase.co'
const SB_KEY = 'sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz'
async function sbFetch(path, options = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, { method: options.method || 'GET', headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': options.prefer || 'return=representation' }, body: options.body || undefined })
  const text = await res.text(); return text ? JSON.parse(text) : []
}
async function addLabRequest(data) { return sbFetch('lab_requests', { method: 'POST', body: JSON.stringify(data) }) }
async function addImagingRequest(data) { return sbFetch('imaging_requests', { method: 'POST', body: JSON.stringify(data) }) }
async function getPatientMessages(patientId) { return sbFetch('patient_messages?patient_id=eq.' + patientId + '&order=created_at.asc&select=*') }
async function addPatientMessage(data) { return sbFetch('patient_messages', { method: 'POST', body: JSON.stringify(data) }) }

export default function Doctor({ brand, products }) {
  const { auth } = useAuth()
  const staffName = auth?.staff ? auth.staff.full_name : (auth?.brand?.owner || 'Doctor')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [triageData, setTriageData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [labResults, setLabResults] = useState([])
  const [consult, setConsult] = useState({})
  const [meds, setMeds] = useState([])
  const [medSearch, setMedSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [sentTo, setSentTo] = useState([])
  // Destinations — doctor can select multiple
  const [destinations, setDestinations] = useState({ pharmacy: false, lab: false, imaging: false })
  // Lab tests to order
  const [labTests, setLabTests] = useState([])
  const [labTestInput, setLabTestInput] = useState('')
  // Imaging requests
  const [imagingRequests, setImagingRequests] = useState([{ scan_type: '', body_part: '', clinical_info: '' }])
  const { msg, show: showToast } = useToast()
  const c = (k, v) => setConsult(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const p = await getPatients(brand.id); setPatients((p || []).filter(x => x.status === 'at_doctor')) } catch (e) {}
    setLoading(false)
  }

  async function openPatient(p) {
    setSelected(p); setConsult({}); setMeds([]); setDone(false); setSentTo([])
    setDestinations({ pharmacy: false, lab: false, imaging: false })
    setLabTests([]); setLabTestInput('')
    setImagingRequests([{ scan_type: '', body_part: '', clinical_info: '' }])
    try {
      const [t, msgs] = await Promise.all([getTriage(p.id), getPatientMessages(p.id)])
      setTriageData(t)
      setMessages(msgs || [])
    } catch (e) {}
  }

  const medicines = (products || []).filter(p => (p.cat || p.category) === 'Medicines' && (p.name.toLowerCase().includes(medSearch.toLowerCase()) || (p.generic_name || '').toLowerCase().includes(medSearch.toLowerCase())))
  const addMed = m => { setMeds(prev => [...prev, { ...m, dose: '', freq: '', dur: '', route: 'Oral', instructions: '' }]); setMedSearch('') }
  const updMed = (i, k, v) => setMeds(prev => prev.map((m, j) => j === i ? { ...m, [k]: v } : m))

  async function sendToPharmacy() {
    if (!consult.dx1) { alert('Please enter at least a primary diagnosis.'); return }
    if (!destinations.pharmacy && !destinations.lab && !destinations.imaging) {
      alert('Please select at least one destination — Pharmacy, Lab or Imaging.'); return
    }
    setSaving(true)
    try {
      const sentDestinations = []
      // Save consultation with doctor name
      const c = await addConsultation({
        patient_id: selected.id,
        business_id: brand.id,
        hpi: consult.hpi || '',
        examination: consult.exam || '',
        primary_diagnosis: consult.dx1 || '',
        secondary_diagnosis: consult.dx2 || '',
        clinical_notes: consult.notes || '',
        disposition: consult.disposition || 'Discharge',
        referral_dest: consult.refDest || '',
        referral_reason: consult.refReason || '',
        ward: consult.ward || '',
        counselling: consult.counselling || '',
        doctor_name: staffName,
        performed_by: staffName,
        status: 'completed',
      })

      // Send to Pharmacy
      if (destinations.pharmacy && meds.length > 0) {
        await addPrescription({
          patient_id: selected.id,
          consultation_id: (c[0] || {}).id || null,
          business_id: brand.id,
          patient_name: selected.full_name,
          doctor_name: staffName,
          medicines: JSON.stringify(meds),
          lab_tests: consult.labTests || '',
          imaging: consult.imaging || '',
          notes: consult.prescNotes || '',
          status: 'pending',
        })
        sentDestinations.push('pharmacy')
      }

      // Send to Lab
      if (destinations.lab && labTests.length > 0) {
        await addLabRequest({
          patient_id: selected.id,
          business_id: brand.id,
          consultation_id: (c[0] || {}).id || null,
          patient_name: selected.full_name,
          requested_by: staffName,
          tests: JSON.stringify(labTests.map(t => ({ name: t }))),
          status: 'pending',
          priority: consult.labPriority || 'routine',
          notes: consult.labNotes || '',
        })
        sentDestinations.push('lab')
      }

      // Send to Imaging
      if (destinations.imaging) {
        for (const img of imagingRequests.filter(i => i.scan_type)) {
          await addImagingRequest({
            patient_id: selected.id,
            business_id: brand.id,
            consultation_id: (c[0] || {}).id || null,
            patient_name: selected.full_name,
            requested_by: staffName,
            scan_type: img.scan_type,
            body_part: img.body_part || '',
            clinical_info: img.clinical_info || consult.dx1 || '',
            status: 'pending',
          })
        }
        sentDestinations.push('imaging')
      }

      // Determine patient next status
      let nextStatus = 'discharged'
      if (sentDestinations.includes('lab') || sentDestinations.includes('imaging')) nextStatus = 'at_lab'
      else if (sentDestinations.includes('pharmacy')) nextStatus = 'at_pharmacy'
      await updatePatient(selected.id, { status: nextStatus })

      // Send message to communication thread
      await addPatientMessage({
        patient_id: selected.id,
        business_id: brand.id,
        sender_name: staffName,
        sender_role: 'Doctor',
        department: 'Consultation',
        message: 'Consultation complete. Diagnosis: ' + consult.dx1 + '. Sent to: ' + sentDestinations.join(', '),
        message_type: 'consultation',
      })

      setSentTo(sentDestinations)
      setDone(true)
      load()
    } catch (e) { alert('Error saving consultation. Please try again.') }
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
      {/* Destination Selection */}
      <Card style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>📤 Send Patient To</div>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Select all that apply — patient will be sent to each selected department</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Pharmacy */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: '2px solid ' + (destinations.pharmacy ? '#0f766e' : '#e5e7eb'), background: destinations.pharmacy ? '#f0fdfa' : 'white', cursor: 'pointer' }}>
            <input type='checkbox' checked={destinations.pharmacy} onChange={e => setDestinations(p => ({ ...p, pharmacy: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#0f766e' }} />
            <div><div style={{ fontWeight: '700', fontSize: '14px' }}>💊 Pharmacy</div><div style={{ fontSize: '12px', color: '#888' }}>Send prescription for dispensing</div></div>
          </label>
          {/* Lab */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: '2px solid ' + (destinations.lab ? '#d97706' : '#e5e7eb'), background: destinations.lab ? '#fffbeb' : 'white', cursor: 'pointer' }}>
            <input type='checkbox' checked={destinations.lab} onChange={e => setDestinations(p => ({ ...p, lab: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#d97706' }} />
            <div><div style={{ fontWeight: '700', fontSize: '14px' }}>🔬 Laboratory</div><div style={{ fontSize: '12px', color: '#888' }}>Send blood tests and investigations</div></div>
          </label>
          {/* Imaging */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: '2px solid ' + (destinations.imaging ? '#7c3aed' : '#e5e7eb'), background: destinations.imaging ? '#f5f3ff' : 'white', cursor: 'pointer' }}>
            <input type='checkbox' checked={destinations.imaging} onChange={e => setDestinations(p => ({ ...p, imaging: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }} />
            <div><div style={{ fontWeight: '700', fontSize: '14px' }}>🩻 Imaging / Radiology</div><div style={{ fontSize: '12px', color: '#888' }}>Send X-ray, USS, CT scan requests</div></div>
          </label>
        </div>

        {/* Lab test entry */}
        {destinations.lab && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>🔬 Lab Tests to Order</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input value={labTestInput} onChange={e => setLabTestInput(e.target.value)} placeholder='Type test name and press Add'
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && labTestInput.trim()) { setLabTests(prev => [...prev, labTestInput.trim()]); setLabTestInput('') } }} />
              <button onClick={() => { if (labTestInput.trim()) { setLabTests(prev => [...prev, labTestInput.trim()]); setLabTestInput('') } }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#d97706', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Malaria RDT', 'FBC', 'PCV', 'Blood Sugar', 'Widal', 'Urinalysis', 'LFT', 'KFT', 'HIV', 'HBsAg'].map(t => (
                <button key={t} onClick={() => !labTests.includes(t) && setLabTests(prev => [...prev, t])}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid ' + (labTests.includes(t) ? '#d97706' : '#e5e7eb'), background: labTests.includes(t) ? '#fffbeb' : 'white', color: labTests.includes(t) ? '#d97706' : '#555', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>
                  {labTests.includes(t) ? '✓ ' : '+ '}{t}
                </button>
              ))}
            </div>
            {labTests.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {labTests.map((t, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '600' }}>
                    🔬 {t}
                    <button onClick={() => setLabTests(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: '900', fontSize: '14px', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <Sel label='Priority' value={consult.labPriority} onChange={v => setConsult(p => ({ ...p, labPriority: v }))} options={['routine', 'urgent', 'stat']} style={{ marginTop: '10px' }} />
          </div>
        )}

        {/* Imaging entry */}
        {destinations.imaging && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>🩻 Imaging Requests</div>
            {imagingRequests.map((img, i) => (
              <div key={i} style={{ marginBottom: '12px', padding: '12px', borderRadius: '8px', background: 'white', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <Sel label='Scan Type' value={img.scan_type} onChange={v => setImagingRequests(prev => prev.map((x, j) => j === i ? { ...x, scan_type: v } : x))} options={['X-ray', 'Ultrasound (USS)', 'CT Scan', 'MRI', 'Echocardiogram', 'Mammogram', 'Other']} />
                  <Sel label='Body Part' value={img.body_part} onChange={v => setImagingRequests(prev => prev.map((x, j) => j === i ? { ...x, body_part: v } : x))} options={['Chest', 'Abdomen', 'Pelvis', 'Head', 'Spine', 'Upper Limb', 'Lower Limb', 'Neck', 'Heart', 'Other']} />
                </div>
                <Inp label='Clinical Information' value={img.clinical_info} onChange={v => setImagingRequests(prev => prev.map((x, j) => j === i ? { ...x, clinical_info: v } : x))} placeholder='Reason for scan...' />
                {imagingRequests.length > 1 && <button onClick={() => setImagingRequests(prev => prev.filter((_, j) => j !== i))} style={{ marginTop: '6px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Remove</button>}
              </div>
            ))}
            <button onClick={() => setImagingRequests(prev => [...prev, { scan_type: '', body_part: '', clinical_info: '' }])}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px dashed #7c3aed', background: 'white', color: '#7c3aed', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>+ Add Another Scan</button>
          </div>
        )}
      </Card>

      {/* Communication thread */}
      {messages.length > 0 && (
        <Card style={{ padding: '20px', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>💬 Patient Communications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {messages.map(m => (
              <div key={m.id} style={{ padding: '10px 14px', borderRadius: '10px', background: m.sender_role === 'Doctor' ? '#f5f3ff' : '#f0fdfa', border: '1px solid ' + (m.sender_role === 'Doctor' ? '#ddd6fe' : '#ccfbf1') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: m.sender_role === 'Doctor' ? '#7c3aed' : TEALC }}>{m.sender_name} — {m.sender_role} ({m.department})</span>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#333' }}>{m.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <button onClick={sendToPharmacy} disabled={saving}
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : 'Save & Send to Selected Departments →'}
      </button>
      <Toast msg={msg} />
    </div>
  )

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
      <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Consultation Saved!</div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Patient: <strong>{selected.full_name}</strong></div>
      <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>Doctor: <strong>{staffName}</strong></div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        {sentTo.includes('pharmacy') && <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '13px', color: '#0f766e', fontWeight: '700' }}>💊 Prescription sent to Pharmacy</div>}
        {sentTo.includes('lab') && <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#fefce8', border: '1px solid #fde047', fontSize: '13px', color: '#854d0e', fontWeight: '700' }}>🔬 Lab request sent</div>}
        {sentTo.includes('imaging') && <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '13px', color: '#7c3aed', fontWeight: '700' }}>🩻 Imaging request sent</div>}
        {sentTo.length === 0 && <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', color: '#059669', fontWeight: '700' }}>✅ Patient discharged</div>}
      </div>
      <div><TealBtn onClick={() => { setSelected(null); setDone(false); setTriageData(null); setMessages([]); load() }}>Back to Patient List</TealBtn></div>
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
