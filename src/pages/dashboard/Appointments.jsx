import { useState, useEffect } from 'react'
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../../lib/supabase'
import { todayDate } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, Textarea, GhostBtn, TealBtn, RedBtn, Avatar, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Appointments({ brand, role, perms }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: todayDate() })
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const a = await getAppointments(brand.id); setAppointments(a || []) } catch (e) {}
    setLoading(false)
  }

  async function save() {
    if (!form.clientName || !form.date || !form.time) { alert('Please enter client name, date and time.'); return }
    setSaving(true)
    try {
      await addAppointment({
        business_id: brand.id,
        client_name: form.clientName,
        service: form.service || '',
        date: form.date,
        time: form.time,
        status: 'pending',
        staff_name: form.staffName || '',
        notes: form.notes || '',
      })
      showToast('Appointment booked!')
      setForm({ date: todayDate() }); setShowAdd(false); load()
    } catch (e) { alert('Error saving appointment.') }
    setSaving(false)
  }

  async function updateStatus(id, status) {
    try { await updateAppointment(id, { status }); load(); showToast('Status updated!') } catch (e) {}
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this appointment?')) return
    try { await deleteAppointment(id); load(); showToast('Appointment deleted') } catch (e) {}
  }

  const today = todayDate()
  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)
  const todayAppts = appointments.filter(a => a.date === today)
  const pendingCount = appointments.filter(a => a.status === 'pending').length

  return (
    <div>
      <SectionHead title='Appointments' sub='Manage all bookings and schedules' btn='+ New Appointment' onBtn={() => setShowAdd(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='📅' label='Today' value={todayAppts.length} sub={todayAppts.filter(a => a.status === 'confirmed').length + ' confirmed'} />
        <StatCard icon='⏳' label='Pending' value={pendingCount} alert={pendingCount > 0} />
        <StatCard icon='✅' label='Total' value={appointments.length} />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: filter === s ? '#0f766e' : '#f3f4f6', color: filter === s ? 'white' : '#666', textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='📅' message='No appointments found' action='+ Book Appointment' onAction={() => setShowAdd(true)} />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f5f5f5', background: '#fafafa' }}>
                  {['Client', 'Service', 'Date', 'Time', 'Staff', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f9f9f9', background: a.date === today ? '#f0fdfa' : 'white' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={a.client_name} size={30} />
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>{a.client_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{a.service || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700' }}>{a.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{a.time}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>{a.staff_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Pill label={a.status} type={a.status === 'confirmed' ? 'green' : a.status === 'completed' ? 'teal' : a.status === 'cancelled' ? 'red' : 'amber'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {a.status === 'pending' && <button onClick={() => updateStatus(a.id, 'confirmed')} style={{ padding: '4px 9px', borderRadius: '7px', border: 'none', background: '#059669', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>Confirm</button>}
                        {a.status === 'confirmed' && <button onClick={() => updateStatus(a.id, 'completed')} style={{ padding: '4px 9px', borderRadius: '7px', border: 'none', background: '#0f766e', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>Complete</button>}
                        {a.status !== 'cancelled' && a.status !== 'completed' && <button onClick={() => updateStatus(a.id, 'cancelled')} style={{ padding: '4px 9px', borderRadius: '7px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>}
                        {perms?.canDelete && <RedBtn onClick={() => handleDelete(a.id)} style={{ padding: '4px 9px', fontSize: '11px' }}>Del</RedBtn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({ date: todayDate() }) }} title='New Appointment'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({ date: todayDate() }) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Book Appointment'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Inp label='Client Name *' value={form.clientName} onChange={v => f('clientName', v)} placeholder='Client full name' required />
          <Inp label='Service' value={form.service} onChange={v => f('service', v)} placeholder='e.g. Facial Treatment, Consultation' />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Date *' value={form.date} onChange={v => f('date', v)} type='date' required />
            <Inp label='Time *' value={form.time} onChange={v => f('time', v)} type='time' required />
          </div>
          <Inp label='Assigned Staff' value={form.staffName} onChange={v => f('staffName', v)} placeholder='Staff / therapist name' />
          <Textarea label='Notes' value={form.notes} onChange={v => f('notes', v)} placeholder='Any special notes or instructions...' rows={2} />
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
