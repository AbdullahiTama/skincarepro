import { useState, useEffect } from 'react'
import { getPrescriptions, updatePrescription, updatePatient } from '../../../lib/supabase'
import { fmt } from '../../../lib/utils'
import { Card, StatCard, SectionHead, Pill, TealBtn, GhostBtn, Avatar, Loading, Empty, useToast, Toast } from '../../../components/ui'

export default function RxInbox({ brand, products }) {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [dispensing, setDispensing] = useState(false)
  const { msg, show: showToast } = useToast()

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [brand?.id])

  async function load() {
    try { const p = await getPrescriptions(brand.id); setPrescriptions(p || []) } catch (e) {}
    setLoading(false)
  }

  async function markDispensed(rx) {
    setDispensing(true)
    try {
      await updatePrescription(rx.id, { status: 'dispensed' })
      if (rx.patient_id) await updatePatient(rx.patient_id, { status: 'discharged' })
      showToast('Prescription dispensed! Patient discharged.')
      load(); setSelected(null)
    } catch (e) { showToast('Error. Please try again.') }
    setDispensing(false)
  }

  const pending = prescriptions.filter(p => p.status === 'pending')
  const dispensed = prescriptions.filter(p => p.status === 'dispensed')

  if (selected) {
    let meds = []
    try { meds = JSON.parse(selected.medicines || '[]') } catch (e) {}
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => setSelected(null)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <div><div style={{ fontWeight: '900', fontSize: '18px' }}>Prescription Details</div><div style={{ fontSize: '12px', color: '#aaa' }}>Patient: {selected.patient_name}</div></div>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '12px', color: '#0f766e', fontWeight: '600', marginBottom: '14px' }}>
          💊 Pharmacy — Prescription received from Doctor
        </div>
        <Card style={{ padding: '16px', marginBottom: '14px', background: '#fafafa' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '8px' }}>Prescription Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[['Patient', selected.patient_name], ['Doctor', selected.doctor_name || '—'], ['Date', selected.created_at?.split('T')[0] || '—'], ['Status', selected.status]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700' }}>{l}</div><div style={{ fontSize: '12px', fontWeight: '600' }}>{v}</div></div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Prescribed Medicines ({meds.length})</div>
          {meds.length === 0 ? <div style={{ color: '#aaa', fontSize: '13px' }}>No medicines prescribed</div>
            : meds.map((med, i) => {
              const stockItem = (products || []).find(p => p.id === med.id || p.name === med.name)
              return (
                <div key={i} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #f0f0f0', marginBottom: '8px', background: '#fafafa' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>{med.emoji || '💊'} {med.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
                    {[['Dose', med.dose], ['Frequency', med.freq], ['Duration', med.dur], ['Route', med.route]].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l} style={{ fontSize: '12px' }}><span style={{ color: '#888', fontWeight: '600' }}>{l}: </span><span>{v}</span></div>
                    ))}
                  </div>
                  {med.instructions && <div style={{ fontSize: '12px', color: '#555', padding: '6px 8px', borderRadius: '6px', background: 'white', border: '1px solid #f0f0f0' }}>📋 {med.instructions}</div>}
                  {stockItem && stockItem.stock <= 0 && <div style={{ marginTop: '6px', padding: '6px 8px', borderRadius: '6px', background: '#fef2f2', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>⚠️ OUT OF STOCK — Please inform doctor</div>}
                  {stockItem && stockItem.stock > 0 && <div style={{ marginTop: '6px', fontSize: '11px', color: '#059669' }}>✓ {stockItem.stock} units in stock</div>}
                </div>
              )
            })}
        </Card>
        {selected.lab_tests && <Card style={{ padding: '16px', marginBottom: '14px' }}><div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Lab Tests</div><div style={{ fontSize: '13px', color: '#555' }}>{selected.lab_tests}</div></Card>}
        {selected.imaging && <Card style={{ padding: '16px', marginBottom: '14px' }}><div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Imaging</div><div style={{ fontSize: '13px', color: '#555' }}>{selected.imaging}</div></Card>}
        {selected.notes && <Card style={{ padding: '16px', marginBottom: '14px' }}><div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Doctor Notes</div><div style={{ fontSize: '13px', color: '#555' }}>{selected.notes}</div></Card>}
        {selected.status === 'pending' ? (
          <button onClick={() => markDispensed(selected)} disabled={dispensing}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: dispensing ? 'not-allowed' : 'pointer', opacity: dispensing ? 0.7 : 1 }}>
            {dispensing ? 'Saving...' : '✅ Mark as Dispensed — Discharge Patient'}
          </button>
        ) : (
          <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#059669' }}>✅ Already Dispensed</div>
        )}
        <Toast msg={msg} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div><div style={{ fontSize: '20px', fontWeight: '900' }}>Prescription Inbox</div><div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>Prescriptions sent from doctors</div></div>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#0f766e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>🔄 Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <StatCard icon='💊' label='Pending Dispensing' value={pending.length} alert={pending.length > 0} />
        <StatCard icon='✅' label='Dispensed' value={dispensed.length} />
      </div>
      {pending.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '14px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <div><div style={{ fontWeight: '700', color: '#0f766e', fontSize: '14px' }}>{pending.length} prescription(s) waiting to be dispensed!</div><div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{pending.map(p => p.patient_name).join(' · ')}</div></div>
        </div>
      )}
      {loading ? <Loading /> : prescriptions.length === 0 ? (
        <Empty icon='💊' message='No prescriptions yet' />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {prescriptions.map(rx => {
            let medCount = 0; try { medCount = JSON.parse(rx.medicines || '[]').length } catch (e) {}
            return (
              <Card key={rx.id} style={{ padding: '16px', cursor: 'pointer', border: rx.status === 'pending' ? '1px solid #ccfbf1' : '1px solid #f0f0f0' }} onClick={() => setSelected(rx)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: rx.status === 'pending' ? '#f0fdfa' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💊</div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '14px' }}>{rx.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Dr. {rx.doctor_name || 'Unknown'} · {medCount} medicine(s)</div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{rx.created_at?.split('T')[0]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <Pill label={rx.status === 'pending' ? 'Pending' : 'Dispensed'} type={rx.status === 'pending' ? 'amber' : 'green'} />
                    <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600' }}>View →</span>
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
