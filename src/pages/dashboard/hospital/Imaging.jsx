import { useState, useEffect } from 'react'
import { useAuth } from '../../../App'
import { TEAL, TEALC } from '../../../lib/utils'
import { Card, StatCard, Inp, Sel, Textarea, GhostBtn, TealBtn, Pill, Loading, Empty, useToast, Toast } from '../../../components/ui'

const SB_URL = 'https://szdybxmgmhndoytqanfb.supabase.co'
const SB_KEY = 'sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz'

async function sbFetch(path, options = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': options.prefer || 'return=representation' },
    body: options.body || undefined,
  })
  const text = await res.text()
  return text ? JSON.parse(text) : []
}

async function getImagingRequests(businessId) { return sbFetch('imaging_requests?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
async function updateImagingRequest(id, data) { return sbFetch('imaging_requests?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
async function addPatientMessage(data) { return sbFetch('patient_messages', { method: 'POST', body: JSON.stringify(data) }) }
async function getPatientMessages(patientId) { return sbFetch('patient_messages?patient_id=eq.' + patientId + '&order=created_at.asc&select=*') }

const SCAN_TYPES = ['X-ray', 'Ultrasound (USS)', 'CT Scan', 'MRI', 'Echocardiogram', 'Mammogram', 'DEXA Scan', 'Fluoroscopy', 'Other']
const BODY_PARTS = ['Chest', 'Abdomen', 'Pelvis', 'Head / Brain', 'Spine', 'Upper Limb', 'Lower Limb', 'Neck', 'Breast', 'Heart', 'Full Body', 'Other']

export default function Imaging({ brand }) {
  const { auth } = useAuth()
  const staffName = auth?.staff ? auth.staff.full_name : (auth?.brand?.owner || 'Radiographer')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [report, setReport] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('pending')
  const { msg, show: showToast } = useToast()

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const r = await getImagingRequests(brand.id); setRequests(r || []) } catch (e) {}
    setLoading(false)
  }

  async function openRequest(req) {
    setSelected(req); setReport(''); setReportUrl(''); setMessage('')
    try { const msgs = await getPatientMessages(req.patient_id); setMessages(msgs || []) } catch (e) {}
  }

  async function submitReport() {
    if (!report.trim()) { showToast('Please enter the imaging report'); return }
    setSaving(true)
    try {
      await updateImagingRequest(selected.id, {
        report,
        report_url: reportUrl || '',
        performed_by: staffName,
        status: 'completed',
      })
      await addPatientMessage({
        patient_id: selected.patient_id,
        business_id: brand.id,
        sender_name: staffName,
        sender_role: 'Radiographer',
        department: 'Imaging',
        message: selected.scan_type + ' report uploaded. ' + report.slice(0, 100) + (report.length > 100 ? '...' : ''),
        message_type: 'imaging_result',
      })
      showToast('Report submitted and sent to Doctor!')
      setSelected(null); load()
    } catch (e) { showToast('Error saving report.') }
    setSaving(false)
  }

  async function sendMessage() {
    if (!message.trim() || !selected) return
    try {
      await addPatientMessage({
        patient_id: selected.patient_id,
        business_id: brand.id,
        sender_name: staffName,
        sender_role: 'Radiographer',
        department: 'Imaging',
        message: message.trim(),
        message_type: 'note',
      })
      setMessage('')
      const msgs = await getPatientMessages(selected.patient_id)
      setMessages(msgs || [])
    } catch (e) {}
  }

  const pending = requests.filter(r => r.status === 'pending')
  const completed = requests.filter(r => r.status === 'completed')
  const filtered = tab === 'pending' ? pending : completed

  if (selected) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setSelected(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <div>
          <div style={{ fontWeight: '900', fontSize: '18px' }}>Imaging Request — {selected.patient_name || 'Patient'}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Requested by: {selected.requested_by} · {selected.created_at?.split('T')[0]}</div>
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '12px', color: '#7c3aed', fontWeight: '600', marginBottom: '16px' }}>
        🩻 Imaging Module · Performed by: <strong>{staffName}</strong>
      </div>

      <Card style={{ padding: '16px', marginBottom: '14px', background: '#fafafa' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '10px' }}>Request Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[['Scan Type', selected.scan_type || '—'], ['Body Part', selected.body_part || '—'], ['Requested By', selected.requested_by || '—'], ['Priority', selected.priority || 'Routine'], ['Date', selected.created_at?.split('T')[0] || '—'], ['Status', selected.status]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700' }}>{l}</div><div style={{ fontSize: '12px', fontWeight: '600' }}>{v}</div></div>
          ))}
        </div>
        {selected.clinical_info && (
          <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '12px' }}>
            <strong>Clinical Information:</strong> {selected.clinical_info}
          </div>
        )}
      </Card>

      {selected.status === 'pending' && (
        <Card style={{ padding: '20px', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Upload Report</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Textarea label='Imaging Report / Findings *' value={report} onChange={setReport}
              placeholder={'Enter ' + (selected.scan_type || 'imaging') + ' findings and interpretation...'} rows={6} />
            <Inp label='Report / Image URL (optional)' value={reportUrl} onChange={setReportUrl}
              placeholder='Link to scanned image or PDF report...' />
            <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdfa', fontSize: '12px', color: '#0f766e' }}>
              💡 After submitting, the Doctor will immediately see this report on the patient file
            </div>
          </div>
          <button onClick={submitReport} disabled={saving}
            style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', border: 'none', background: TEAL, color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting...' : '✅ Submit Report & Send to Doctor →'}
          </button>
        </Card>
      )}

      {selected.status === 'completed' && selected.report && (
        <Card style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Report Submitted</div>
          <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.7' }}>{selected.report}</div>
          {selected.report_url && <a href={selected.report_url} target='_blank' rel='noreferrer' style={{ display: 'inline-block', marginTop: '10px', color: TEALC, fontWeight: '700', fontSize: '13px' }}>View Image/PDF →</a>}
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>Performed by: {selected.performed_by}</div>
        </Card>
      )}

      <Card style={{ padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>💬 Communication with Doctor</div>
        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ccc', fontSize: '13px', padding: '16px' }}>No messages yet</div>
          ) : messages.map(m => (
            <div key={m.id} style={{ padding: '10px 14px', borderRadius: '10px', background: m.department === 'Imaging' ? '#f5f3ff' : '#f0fdfa', border: '1px solid ' + (m.department === 'Imaging' ? '#ddd6fe' : '#ccfbf1') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: m.department === 'Imaging' ? '#7c3aed' : TEALC }}>{m.sender_name} — {m.sender_role}</span>
                <span style={{ fontSize: '10px', color: '#aaa' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#333' }}>{m.message}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder='Message to Doctor...'
            style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <TealBtn onClick={sendMessage} style={{ padding: '9px 16px' }}>Send</TealBtn>
        </div>
      </Card>
      <Toast msg={msg} />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>Imaging / Radiology</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>Scan requests from doctors · Logged in as: <strong>{staffName}</strong></div>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: TEALC, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>🔄 Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='🩻' label='Pending Scans' value={pending.length} alert={pending.length > 0} />
        <StatCard icon='✅' label='Completed' value={completed.length} />
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '14px', background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <div><div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '14px' }}>{pending.length} scan request(s) waiting!</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['pending', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: tab === t ? '#0f766e' : '#f3f4f6', color: tab === t ? 'white' : '#666', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='🩻' message={tab === 'pending' ? 'No pending scan requests' : 'No completed scans yet'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(req => (
            <Card key={req.id} style={{ padding: '16px', cursor: 'pointer', border: req.status === 'pending' ? '1px solid #ddd6fe' : '1px solid #f0f0f0' }} onClick={() => openRequest(req)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: req.status === 'pending' ? '#f5f3ff' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🩻</div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{req.patient_name || 'Patient'}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{req.scan_type} — {req.body_part}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Requested by: {req.requested_by} · {req.created_at?.split('T')[0]}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <Pill label={req.status === 'pending' ? 'Pending' : 'Done'} type={req.status === 'pending' ? 'amber' : 'green'} />
                  <span style={{ fontSize: '12px', color: TEALC, fontWeight: '600' }}>Open →</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Toast msg={msg} />
    </div>
  )
}
