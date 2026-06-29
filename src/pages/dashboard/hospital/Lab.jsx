import { useState, useEffect } from 'react'
import { useAuth } from '../../../App'
import { getPatients, updatePatient } from '../../../lib/supabase'
import { fmt, todayDate, TEAL, TEALC } from '../../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, Textarea, GhostBtn, TealBtn, Avatar, Loading, Empty, useToast, Toast } from '../../../components/ui'

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

async function getLabRequests(businessId) { return sbFetch('lab_requests?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
async function getLabResults(requestId) { return sbFetch('lab_results?lab_request_id=eq.' + requestId + '&select=*') }
async function addLabResult(data) { return sbFetch('lab_results', { method: 'POST', body: JSON.stringify(data) }) }
async function updateLabRequest(id, data) { return sbFetch('lab_requests?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
async function addPatientMessage(data) { return sbFetch('patient_messages', { method: 'POST', body: JSON.stringify(data) }) }
async function getPatientMessages(patientId) { return sbFetch('patient_messages?patient_id=eq.' + patientId + '&order=created_at.asc&select=*') }

const COMMON_TESTS = [
  { name: 'Malaria RDT', type: 'result', options: ['Positive', 'Negative'] },
  { name: 'Full Blood Count (FBC)', type: 'text' },
  { name: 'Packed Cell Volume (PCV)', type: 'number', unit: '%' },
  { name: 'Blood Sugar (Fasting)', type: 'number', unit: 'mmol/L' },
  { name: 'Blood Sugar (Random)', type: 'number', unit: 'mmol/L' },
  { name: 'Widal Test', type: 'result', options: ['Positive', 'Negative', 'Borderline'] },
  { name: 'Hepatitis B Surface Antigen', type: 'result', options: ['Positive', 'Negative'] },
  { name: 'HIV Screening', type: 'result', options: ['Positive', 'Negative'] },
  { name: 'Urinalysis', type: 'text' },
  { name: 'Stool Analysis', type: 'text' },
  { name: 'Blood Culture', type: 'text' },
  { name: 'Liver Function Test (LFT)', type: 'text' },
  { name: 'Kidney Function Test (KFT)', type: 'text' },
  { name: 'Lipid Profile', type: 'text' },
  { name: 'Thyroid Function Test', type: 'text' },
  { name: 'Pregnancy Test (urine)', type: 'result', options: ['Positive', 'Negative'] },
  { name: 'Blood Group & Genotype', type: 'text' },
  { name: 'ESR', type: 'number', unit: 'mm/hr' },
  { name: 'Other', type: 'text' },
]

export default function Lab({ brand }) {
  const { auth } = useAuth()
  const staffName = auth?.staff ? auth.staff.full_name : (auth?.brand?.owner || 'Lab Technician')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [results, setResults] = useState({})
  const [summary, setSummary] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('pending')
  const { msg, show: showToast } = useToast()

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const r = await getLabRequests(brand.id); setRequests(r || []) } catch (e) {}
    setLoading(false)
  }

  async function openRequest(req) {
    setSelected(req)
    setResults({})
    setSummary('')
    setMessage('')
    try {
      const msgs = await getPatientMessages(req.patient_id)
      setMessages(msgs || [])
    } catch (e) {}
  }

  async function submitResults() {
    if (!selected) return
    setSaving(true)
    try {
      const testsOrdered = JSON.parse(selected.tests || '[]')
      const resultsList = testsOrdered.map(test => ({
        test_name: test.name || test,
        result: results[test.name || test] || '',
        unit: test.unit || '',
        normal_range: test.normal_range || '',
      }))

      await addLabResult({
        lab_request_id: selected.id,
        patient_id: selected.patient_id,
        business_id: brand.id,
        performed_by: staffName,
        results: JSON.stringify(resultsList),
        summary: summary,
        status: 'completed',
      })

      await updateLabRequest(selected.id, { status: 'completed' })

      // Send message to doctor
      await addPatientMessage({
        patient_id: selected.patient_id,
        business_id: brand.id,
        sender_name: staffName,
        sender_role: 'Lab Technician',
        department: 'Laboratory',
        message: 'Lab results uploaded for patient. ' + (summary ? 'Summary: ' + summary : ''),
        message_type: 'lab_result',
      })

      showToast('Results submitted and sent to Doctor!')
      setSelected(null)
      load()
    } catch (e) { showToast('Error saving results. Please try again.') }
    setSaving(false)
  }

  async function sendMessage() {
    if (!message.trim() || !selected) return
    try {
      await addPatientMessage({
        patient_id: selected.patient_id,
        business_id: brand.id,
        sender_name: staffName,
        sender_role: 'Lab Technician',
        department: 'Laboratory',
        message: message.trim(),
        message_type: 'note',
      })
      setMessage('')
      const msgs = await getPatientMessages(selected.patient_id)
      setMessages(msgs || [])
      showToast('Message sent!')
    } catch (e) {}
  }

  const pending = requests.filter(r => r.status === 'pending')
  const completed = requests.filter(r => r.status === 'completed')
  const filtered = tab === 'pending' ? pending : completed

  if (selected) {
    let tests = []
    try { tests = JSON.parse(selected.tests || '[]') } catch (e) {}

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => setSelected(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <div>
            <div style={{ fontWeight: '900', fontSize: '18px' }}>Lab Request — {selected.patient_name || 'Patient'}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Requested by: {selected.requested_by} · {selected.created_at?.split('T')[0]}</div>
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '12px', color: '#0f766e', fontWeight: '600', marginBottom: '16px' }}>
          🔬 Lab Module · Performed by: <strong>{staffName}</strong> — Your name will be attached to all results
        </div>

        {selected.notes && (
          <Card style={{ padding: '14px', marginBottom: '14px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>Doctor's Notes</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{selected.notes}</div>
          </Card>
        )}

        {selected.status === 'pending' && (
          <Card style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>Enter Test Results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tests.map((test, i) => {
                const testName = test.name || test
                const testDef = COMMON_TESTS.find(t => t.name === testName)
                return (
                  <div key={i} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>🔬 {testName}</div>
                    {testDef?.type === 'result' ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {testDef.options.map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (results[testName] === opt ? TEALC : '#e5e7eb'), background: results[testName] === opt ? '#f0fdfa' : 'white', cursor: 'pointer', fontSize: '13px' }}>
                            <input type='radio' checked={results[testName] === opt} onChange={() => setResults(prev => ({ ...prev, [testName]: opt }))} style={{ accentColor: TEALC }} />
                            <span style={{ fontWeight: results[testName] === opt ? '700' : '400', color: results[testName] === opt ? (opt === 'Positive' ? '#dc2626' : '#059669') : '#555' }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : testDef?.type === 'number' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type='number' value={results[testName] || ''} onChange={e => setResults(prev => ({ ...prev, [testName]: e.target.value }))}
                          placeholder='Enter value' style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
                        {testDef.unit && <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>{testDef.unit}</span>}
                      </div>
                    ) : (
                      <textarea value={results[testName] || ''} onChange={e => setResults(prev => ({ ...prev, [testName]: e.target.value }))}
                        placeholder='Enter result...' rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    )}
                  </div>
                )
              })}
              <Textarea label='Overall Summary / Interpretation' value={summary} onChange={setSummary} placeholder='Overall interpretation of results, recommendations...' rows={3} />
            </div>
            <button onClick={submitResults} disabled={saving}
              style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '12px', border: 'none', background: TEAL, color: 'white', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Submitting...' : '✅ Submit Results & Send to Doctor →'}
            </button>
          </Card>
        )}

        {selected.status === 'completed' && (
          <Card style={{ padding: '16px', marginBottom: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: '700', color: '#059669', fontSize: '14px' }}>✅ Results already submitted for this request</div>
          </Card>
        )}

        {/* Communication thread */}
        <Card style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>💬 Communication with Doctor</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#ccc', fontSize: '13px', padding: '20px' }}>No messages yet</div>
            ) : messages.map(m => (
              <div key={m.id} style={{ padding: '10px 14px', borderRadius: '10px', background: m.sender_role === 'Lab Technician' ? '#f0fdfa' : '#f5f3ff', border: '1px solid ' + (m.sender_role === 'Lab Technician' ? '#ccfbf1' : '#ddd6fe') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: m.sender_role === 'Lab Technician' ? TEALC : '#7c3aed' }}>{m.sender_name} — {m.sender_role}</span>
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{m.created_at?.replace('T', ' ').slice(0, 16)}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#333' }}>{m.message}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder='Send message to Doctor...'
              style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <TealBtn onClick={sendMessage} style={{ padding: '9px 16px' }}>Send</TealBtn>
          </div>
        </Card>

        <Toast msg={msg} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>Laboratory</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>Lab requests from doctors · Logged in as: <strong>{staffName}</strong></div>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: TEALC, fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>🔄 Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='🔬' label='Pending Tests' value={pending.length} alert={pending.length > 0} />
        <StatCard icon='✅' label='Completed Today' value={completed.length} />
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '14px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <div>
            <div style={{ fontWeight: '700', color: TEALC, fontSize: '14px' }}>{pending.length} lab request(s) waiting!</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{pending.map(r => r.patient_name || 'Patient').join(' · ')}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['pending', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', background: tab === t ? '#0f766e' : '#f3f4f6', color: tab === t ? 'white' : '#666', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='🔬' message={tab === 'pending' ? 'No pending lab requests' : 'No completed tests yet'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(req => {
            let tests = []
            try { tests = JSON.parse(req.tests || '[]') } catch (e) {}
            return (
              <Card key={req.id} style={{ padding: '16px', cursor: 'pointer', border: req.status === 'pending' ? '1px solid #ccfbf1' : '1px solid #f0f0f0' }} onClick={() => openRequest(req)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: req.status === 'pending' ? '#f0fdfa' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🔬</div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px' }}>{req.patient_name || 'Patient'}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{tests.length} test(s) · Requested by: {req.requested_by}</div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{req.created_at?.replace('T', ' ').slice(0, 16)}</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {tests.slice(0, 4).map((t, i) => <span key={i} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: '#f0fdfa', color: TEALC, fontWeight: '600' }}>{t.name || t}</span>)}
                        {tests.length > 4 && <span style={{ fontSize: '10px', color: '#aaa' }}>+{tests.length - 4} more</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <Pill label={req.status === 'pending' ? 'Pending' : 'Completed'} type={req.status === 'pending' ? 'amber' : 'green'} />
                    {req.priority === 'urgent' && <Pill label='URGENT' type='red' />}
                    <span style={{ fontSize: '12px', color: TEALC, fontWeight: '600' }}>Open →</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Toast msg={msg} />
    </div>
  )
}
