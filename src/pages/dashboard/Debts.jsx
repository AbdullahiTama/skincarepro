import { useState, useEffect } from 'react'
import { getDebts, addDebt, updateDebt } from '../../lib/supabase'
import { fmt, todayDate } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, Textarea, GhostBtn, TealBtn, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Debts({ brand, role, perms }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ direction: 'owes_us' })
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const d = await getDebts(brand.id); setDebts(d || []) } catch (e) {}
    setLoading(false)
  }

  async function save() {
    if (!form.party || !form.amount) { alert('Please enter party name and amount.'); return }
    setSaving(true)
    try {
      const amt = parseFloat(form.amount) || 0
      const paid = parseFloat(form.amountPaid) || 0
      await addDebt({
        business_id: brand.id,
        direction: form.direction || 'owes_us',
        party_name: form.party,
        amount: amt,
        amount_paid: paid,
        balance: amt - paid,
        due_date: form.dueDate || '',
        status: paid >= amt ? 'paid' : 'pending',
        description: form.description || '',
      })
      showToast('Debt recorded!')
      setForm({ direction: 'owes_us' }); setShowAdd(false); load()
    } catch (e) { alert('Error saving.') }
    setSaving(false)
  }

  async function markPaid(debt) {
    try {
      await updateDebt(debt.id, { amount_paid: debt.amount, balance: 0, status: 'paid' })
      load(); showToast('Marked as paid!')
    } catch (e) {}
  }

  const filtered = debts.filter(d => {
    const matchSearch = !search || d.party_name.toLowerCase().includes(search.toLowerCase())
    const matchMonth = !filterMonth || d.created_at?.startsWith(filterMonth)
    return matchSearch && matchMonth
  })

  const owedToUs = debts.filter(d => d.direction === 'owes_us').reduce((s, d) => s + (d.balance || 0), 0)
  const weOwe = debts.filter(d => d.direction === 'we_owe').reduce((s, d) => s + (d.balance || 0), 0)

  return (
    <div>
      <SectionHead title='Debts' sub='Track money owed to you and money you owe' btn='+ Record Debt' onBtn={() => setShowAdd(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <Card style={{ padding: '18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>Clients Owe You</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>{fmt(owedToUs)}</div>
        </Card>
        <Card style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>You Owe Others</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626', marginTop: '6px' }}>{fmt(weOwe)}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search party name...'
          style={{ flex: 1, minWidth: '180px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        <input type='month' value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        {filterMonth && <button onClick={() => setFilterMonth('')} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#555', cursor: 'pointer', fontSize: '12px' }}>Clear</button>}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='🏦' message='No debts recorded' action='+ Record Debt' onAction={() => setShowAdd(true)} />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f5f5f5', background: '#fafafa' }}>
                  {['Direction', 'Party', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '12px 14px' }}><Pill label={d.direction === 'owes_us' ? 'Owed to Us' : 'We Owe'} type={d.direction === 'owes_us' ? 'green' : 'red'} /></td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '13px' }}>{d.party_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700' }}>{fmt(d.amount)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#059669' }}>{fmt(d.amount_paid || 0)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '900', color: (d.balance || 0) > 0 ? '#dc2626' : '#059669' }}>{fmt(d.balance || 0)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#aaa' }}>{d.due_date || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><Pill label={d.status} type={d.status === 'paid' ? 'green' : 'amber'} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      {d.status !== 'paid' && <button onClick={() => markPaid(d)} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>Mark Paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({ direction: 'owes_us' }) }} title='Record Debt'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({ direction: 'owes_us' }) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Save Debt'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '8px' }}>Direction</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[['owes_us', 'Client Owes Us'], ['we_owe', 'We Owe Someone']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid ' + (form.direction === val ? '#0f766e' : '#e5e7eb'), background: form.direction === val ? '#f0fdfa' : 'white', cursor: 'pointer', fontSize: '13px' }}>
                  <input type='radio' checked={form.direction === val} onChange={() => f('direction', val)} style={{ accentColor: '#0f766e' }} />{label}
                </label>
              ))}
            </div>
          </div>
          <Inp label='Party Name *' value={form.party} onChange={v => f('party', v)} placeholder='Client or supplier name' required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Total Amount (₦) *' value={form.amount} onChange={v => f('amount', v)} type='number' placeholder='0' required />
            <Inp label='Amount Already Paid (₦)' value={form.amountPaid} onChange={v => f('amountPaid', v)} type='number' placeholder='0' />
          </div>
          {form.amount && <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#888' }}>Balance Remaining</span>
            <span style={{ fontWeight: '900', color: '#dc2626' }}>{fmt((parseFloat(form.amount) || 0) - (parseFloat(form.amountPaid) || 0))}</span>
          </div>}
          <Inp label='Due Date' value={form.dueDate} onChange={v => f('dueDate', v)} type='date' />
          <Textarea label='Description' value={form.description} onChange={v => f('description', v)} placeholder='What is this debt for?' rows={2} />
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
