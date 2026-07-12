import { useState, useEffect } from 'react'
import { getTerritories, addTerritory, updateTerritory, deleteTerritory, getStaff, getRepAssignments, assignRepToTerritory, removeRepFromTerritory } from '../../lib/supabase'
import { Card, Inp, TealBtn, GhostBtn } from '../../components/ui'

const LEVEL_SUGGESTIONS = ['Region', 'State', 'City', 'LGA', 'Zone']

export default function Territories({ brand, showToast }) {
  const [territories, setTerritories] = useState([])
  const [staff, setStaff] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [assigningTerritory, setAssigningTerritory] = useState(null)

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    if (!brand?.id) return
    setLoading(true)
    try {
      const [terrs, stf] = await Promise.all([getTerritories(brand.id), getStaff(brand.id)])
      setTerritories(terrs || [])
      setStaff(stf || [])
      const ids = (terrs || []).map(t => t.id)
      const assigns = await getRepAssignments(ids)
      setAssignments(assigns || [])
    } catch (e) {
      alert('Failed to load: ' + e.message)
    }
    setLoading(false)
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const openNew = () => { setForm({}); setEditingId(null); setShowForm(true) }

  const openEdit = (t) => {
    setForm({ name: t.name, level: t.level || '', parent_territory_id: t.parent_territory_id || '' })
    setEditingId(t.id)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name) { alert('Please enter a territory name.'); return }
    const payload = {
      business_id: brand.id,
      name: form.name,
      level: form.level || null,
      parent_territory_id: form.parent_territory_id || null,
    }
    try {
      if (editingId) {
        await updateTerritory(editingId, payload)
        showToast && showToast('Territory updated')
      } else {
        await addTerritory(payload)
        showToast && showToast('Territory added')
      }
      setShowForm(false)
      load()
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
  }

  const remove = async (t) => {
    if (!window.confirm('Delete "' + t.name + '"? Rep assignments to it will also be removed.')) return
    try {
      await deleteTerritory(t.id)
      showToast && showToast('Territory deleted')
      load()
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  const repsFor = (territoryId) => assignments.filter(a => a.territory_id === territoryId)
  const parentName = (id) => territories.find(t => t.id === id)?.name || null

  const toggleRep = async (territoryId, staffId) => {
    const existing = assignments.find(a => a.territory_id === territoryId && a.staff_id === staffId)
    try {
      if (existing) {
        await removeRepFromTerritory(existing.id)
      } else {
        await assignRepToTerritory(staffId, territoryId)
      }
      load()
    } catch (e) {
      alert('Failed: ' + e.message)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Territories</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Regions, states, or coverage areas — named however your company works. Assign reps to each.</div>
        </div>
        <TealBtn onClick={openNew}>+ Add Territory</TealBtn>
      </div>

      {loading && <div style={{ color: '#888', fontSize: '13px' }}>Loading...</div>}

      {!loading && territories.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No territories yet</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Add regions or states, then assign reps to cover them.</div>
          <TealBtn onClick={openNew}>+ Add Your First Territory</TealBtn>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {territories.map(t => (
          <Card key={t.id} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{t.name}</span>
                  {t.level && <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: '#e7f6f3', color: '#0f766e' }}>{t.level}</span>}
                </div>
                {parentName(t.parent_territory_id) && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Under: {parentName(t.parent_territory_id)}</div>
                )}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {repsFor(t.id).length === 0 && <span style={{ fontSize: '11px', color: '#aaa' }}>No reps assigned</span>}
                  {repsFor(t.id).map(a => (
                    <span key={a.id} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1' }}>
                      {a.staff?.full_name || 'Rep'}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => setAssigningTerritory(t)} style={{ border: '1px solid #ccfbf1', background: '#f0fdfa', color: '#0f766e', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>Assign Reps</button>
                <button onClick={() => openEdit(t)} style={{ border: '1px solid #e5e7eb', background: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(t)} style={{ border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '16px' }}>
              {editingId ? 'Edit Territory' : 'Add Territory'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Inp label='Territory Name' value={form.name} onChange={v => f('name', v)} placeholder='e.g. Lagos Mainland' required />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '6px' }}>Level (optional)</div>
                <input value={form.level || ''} onChange={e => f('level', e.target.value)} placeholder='e.g. Region, State, City'
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {LEVEL_SUGGESTIONS.map(l => (
                    <button key={l} type='button' onClick={() => f('level', l)}
                      style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '20px', border: '1px solid #e5e7eb', background: form.level === l ? '#0f766e' : 'white', color: form.level === l ? 'white' : '#555', cursor: 'pointer' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '6px' }}>Sits Under (optional)</div>
                <select value={form.parent_territory_id || ''} onChange={e => f('parent_territory_id', e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', background: 'white' }}>
                  <option value=''>None (top level)</option>
                  {territories.filter(t => t.id !== editingId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.level ? ' (' + t.level + ')' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={() => setShowForm(false)} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={save} style={{ flex: 1, padding: '13px' }}>{editingId ? 'Save Changes' : 'Add Territory'}</TealBtn>
            </div>
          </div>
        </div>
      )}

      {assigningTerritory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '540px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
              Assign Reps — {assigningTerritory.name}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>Tap to toggle who covers this territory.</div>

            {staff.length === 0 && <div style={{ fontSize: '13px', color: '#aaa' }}>No staff added yet.</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staff.map(s => {
                const assigned = assignments.some(a => a.territory_id === assigningTerritory.id && a.staff_id === s.id)
                return (
                  <button key={s.id} onClick={() => toggleRep(assigningTerritory.id, s.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', border: assigned ? '1px solid #0f766e' : '1px solid #e5e7eb', background: assigned ? '#f0fdfa' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{s.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{s.public_title || s.role}</div>
                    </div>
                    {assigned && <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f766e' }}>Assigned</span>}
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: '20px' }}>
              <GhostBtn onClick={() => setAssigningTerritory(null)} style={{ width: '100%', padding: '13px' }}>Done</GhostBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
