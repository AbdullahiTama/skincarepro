import { useState, useEffect } from 'react'
import { getExpenses, addExpense, deleteExpense } from '../../lib/supabase'
import { fmt, todayDate, currentMonth, TEAL, EXPENSE_CATS } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, GhostBtn, TealBtn, RedBtn, Loading, Empty, useToast, Toast } from '../../components/ui'

export default function Expenses({ brand, role, perms }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(currentMonth())
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: todayDate() })
  const [saving, setSaving] = useState(false)
  const { msg, show: showToast } = useToast()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try { const e = await getExpenses(brand.id); setExpenses(e || []) } catch (e) {}
    setLoading(false)
  }

  async function save() {
    if (!form.category || !form.amount) { alert('Please enter category and amount.'); return }
    setSaving(true)
    try {
      await addExpense({
        business_id: brand.id,
        category: form.category,
        description: form.description || '',
        amount: parseFloat(form.amount) || 0,
        date: form.date || todayDate(),
        staff_name: form.staffName || '',
      })
      showToast('Expense logged!')
      setForm({ date: todayDate() }); setShowAdd(false); load()
    } catch (e) { alert('Error saving expense.') }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    try { await deleteExpense(id); load(); showToast('Deleted') } catch (e) {}
  }

  const filtered = filterMonth ? expenses.filter(e => e.created_at?.startsWith(filterMonth)) : expenses
  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0)
  const byCategory = {}
  filtered.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0) })

  return (
    <div>
      <SectionHead title='Expenses' sub='Track all business spending' btn='+ Log Expense' onBtn={() => setShowAdd(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='💸' label='Total This Period' value={fmt(total)} />
        <StatCard icon='📊' label='Categories' value={Object.keys(byCategory).length} />
        <StatCard icon='📋' label='Transactions' value={filtered.length} />
      </div>

      {Object.keys(byCategory).length > 0 && (
        <Card style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>Breakdown by Category</div>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#555', width: '120px', fontWeight: '600', flexShrink: 0 }}>{cat}</span>
              <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (total > 0 ? (amt / total) * 100 : 0) + '%', background: TEAL, borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', width: '100px', textAlign: 'right', flexShrink: 0 }}>{fmt(amt)}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type='month' value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        <button onClick={() => setFilterMonth('')} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>All Time</button>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty icon='💸' message='No expenses recorded yet' action='+ Log Expense' onAction={() => setShowAdd(true)} />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f5f5f5', background: '#fafafa' }}>
                  {['Category', 'Description', 'Amount', 'Date', 'Staff', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '12px 16px' }}><Pill label={e.category} type='teal' /></td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{e.description || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '900', color: '#dc2626' }}>{fmt(e.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#aaa' }}>{e.date || e.created_at?.split('T')[0]}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>{e.staff_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {perms?.canDelete && <RedBtn onClick={() => handleDelete(e.id)} style={{ padding: '4px 9px', fontSize: '11px' }}>Delete</RedBtn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal show={showAdd} onClose={() => { setShowAdd(false); setForm({ date: todayDate() }) }} title='Log Expense'
        footer={<><GhostBtn onClick={() => { setShowAdd(false); setForm({ date: todayDate() }) }} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : 'Save Expense'}</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Sel label='Category *' value={form.category} onChange={v => f('category', v)} options={EXPENSE_CATS} required />
          <Inp label='Description' value={form.description} onChange={v => f('description', v)} placeholder='What was this expense for?' />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Amount (₦) *' value={form.amount} onChange={v => f('amount', v)} type='number' placeholder='0' required />
            <Inp label='Date' value={form.date} onChange={v => f('date', v)} type='date' />
          </div>
          <Inp label='Recorded By' value={form.staffName} onChange={v => f('staffName', v)} placeholder='Your name' />
        </div>
      </Modal>

      <Toast msg={msg} />
    </div>
  )
}
