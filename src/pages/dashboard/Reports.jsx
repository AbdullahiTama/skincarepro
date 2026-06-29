import { useState, useEffect } from 'react'
import { getSales, getExpenses, getPurchases } from '../../lib/supabase'
import { fmt, currentMonth, TEAL, TEALC } from '../../lib/utils'
import { Card, StatCard, Loading, useToast, Toast } from '../../components/ui'

export default function Reports({ brand, role, perms }) {
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [customMonth, setCustomMonth] = useState(currentMonth())
  const { msg, show: showToast } = useToast()

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(true)
    try {
      const [s, e, p] = await Promise.all([getSales(brand.id), getExpenses(brand.id), getPurchases(brand.id)])
      setSales(s || []); setExpenses(e || []); setPurchases(p || [])
    } catch (e) {}
    setLoading(false)
  }

  const now = new Date()
  const filterItem = item => {
    const d = item.created_at || ''
    if (period === 'today') return d.startsWith(now.toISOString().split('T')[0])
    if (period === 'week') { const w = new Date(now - 7 * 864e5); return new Date(d) >= w }
    if (period === 'month') return d.startsWith(customMonth)
    if (period === 'year') return d.startsWith(String(now.getFullYear()))
    return true
  }

  const fSales = sales.filter(filterItem).filter(s => !s.is_on_hold)
  const fExpenses = expenses.filter(filterItem)
  const fPurchases = purchases.filter(filterItem)

  const totalRevenue = fSales.reduce((s, x) => s + (x.total || 0), 0)
  const totalExpenses = fExpenses.reduce((s, x) => s + (x.amount || 0), 0)
  const totalPurchases = fPurchases.reduce((s, x) => s + (x.total_cost || 0), 0)
  const netProfit = totalRevenue - totalExpenses - totalPurchases
  const creditBalance = sales.filter(s => s.is_credit && (s.balance || 0) > 0).reduce((s, x) => s + (x.balance || 0), 0)
  const cashCollected = fSales.filter(s => s.is_credit && s.amount_paid > 0).reduce((s, x) => s + (x.amount_paid || 0), 0)

  const byMethod = {}
  fSales.forEach(s => { byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + (s.total || 0) })

  const byExpCat = {}
  fExpenses.forEach(e => { byExpCat[e.category] = (byExpCat[e.category] || 0) + (e.amount || 0) })

  const dailySales = {}
  fSales.forEach(s => { const d = s.created_at?.split('T')[0] || ''; dailySales[d] = (dailySales[d] || 0) + (s.total || 0) })
  const dailyDates = Object.keys(dailySales).sort().slice(-14)
  const maxDaily = Math.max(...Object.values(dailySales), 1)

  function exportCSV() {
    const rows = [
      ['CareHub Financial Report'],
      ['Business', brand?.name || '', 'Period', period === 'month' ? customMonth : period],
      ['Generated', new Date().toLocaleDateString('en-NG')],
      [],
      ['SUMMARY'],
      ['Total Revenue', totalRevenue],
      ['Total Expenses', totalExpenses],
      ['Total Purchases', totalPurchases],
      ['Net Profit', netProfit],
      ['Credit Outstanding', creditBalance],
      [],
      ['SALES DETAIL'],
      ['Date', 'Transaction No', 'Client', 'Total', 'Payment Method', 'Credit?'],
      ...fSales.map(s => [s.created_at?.split('T')[0] || '', s.txn_no || '', s.client_name || 'Walk-in', s.total || 0, s.payment_method || '', s.is_credit ? 'Yes' : 'No']),
      [],
      ['EXPENSES DETAIL'],
      ['Date', 'Category', 'Description', 'Amount', 'Staff'],
      ...fExpenses.map(e => [e.date || e.created_at?.split('T')[0] || '', e.category || '', e.description || '', e.amount || 0, e.staff_name || '']),
      [],
      ['PURCHASES DETAIL'],
      ['Date', 'Supplier', 'Product', 'Total Cost', 'Paid', 'Balance', 'Status'],
      ...fPurchases.map(p => [p.supply_date || '', p.supplier_name || '', p.product_name || '', p.total_cost || 0, p.amount_paid || 0, p.balance || 0, p.status || '']),
    ]
    const csv = rows.map(r => (Array.isArray(r) ? r : [r]).map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'CareHub_Report_' + (period === 'month' ? customMonth : period) + '.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Report exported!')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div><div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>Financial Reports</div><div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>Full breakdown of revenue, expenses and profit</div></div>
        {perms?.canExportReports && (
          <button onClick={exportCSV} style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid #059669', background: 'white', color: '#059669', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            📥 Export to Excel / CSV
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['today', 'week', 'month', 'year', 'all'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: period === p ? '#0f766e' : '#f3f4f6', color: period === p ? 'white' : '#666', textTransform: 'capitalize' }}>
            {p === 'all' ? 'All Time' : p}
          </button>
        ))}
        {period === 'month' && (
          <input type='month' value={customMonth} onChange={e => setCustomMonth(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        )}
      </div>

      {loading ? <Loading /> : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px', marginBottom: '20px' }}>
            <Card style={{ padding: '20px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '4px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#059669' }}>{fmt(totalRevenue)}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{fSales.length} transactions</div>
            </Card>
            <Card style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '4px' }}>Total Expenditure</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#dc2626' }}>{fmt(totalExpenses + totalPurchases)}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Expenses + Purchases</div>
            </Card>
            <Card style={{ padding: '20px', borderLeft: '4px solid ' + (netProfit >= 0 ? '#0f766e' : '#dc2626') }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '4px' }}>Net Profit</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: netProfit >= 0 ? '#0f766e' : '#dc2626' }}>{fmt(netProfit)}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{netProfit >= 0 ? '✅ Profitable' : '⚠️ Loss'}</div>
            </Card>
            <Card style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '4px' }}>Credit Outstanding</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#d97706' }}>{fmt(creditBalance)}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Unpaid credit sales</div>
            </Card>
          </div>

          {/* Revenue by method */}
          {Object.keys(byMethod).length > 0 && (
            <Card style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>Revenue by Payment Method</div>
              {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, amt]) => (
                <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#555', width: '80px', fontWeight: '600', flexShrink: 0 }}>{method}</span>
                  <div style={{ flex: 1, height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (totalRevenue > 0 ? (amt / totalRevenue) * 100 : 0) + '%', background: TEAL, borderRadius: '5px' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', width: '100px', textAlign: 'right', flexShrink: 0 }}>{fmt(amt)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Expense breakdown */}
          {Object.keys(byExpCat).length > 0 && (
            <Card style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>Expense Breakdown</div>
              {Object.entries(byExpCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#555', width: '110px', fontWeight: '600', flexShrink: 0 }}>{cat}</span>
                  <div style={{ flex: 1, height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0) + '%', background: '#fca5a5', borderRadius: '5px' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', width: '100px', textAlign: 'right', flexShrink: 0 }}>{fmt(amt)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Daily chart */}
          {dailyDates.length > 0 && (
            <Card style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>Daily Sales (Last 14 Days)</div>
              {dailyDates.map(date => (
                <div key={date} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#aaa', width: '60px', flexShrink: 0 }}>{date.slice(5)}</span>
                  <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: ((dailySales[date] || 0) / maxDaily * 100) + '%', background: TEAL, borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', width: '90px', textAlign: 'right', flexShrink: 0 }}>{fmt(dailySales[date] || 0)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Recent transactions */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5', fontWeight: '800', fontSize: '15px' }}>Recent Transactions</div>
            {fSales.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>No transactions in this period</div>
            ) : fSales.slice(0, 20).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f9f9f9' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{s.client_name || 'Walk-in'}</div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>{s.txn_no} · {s.created_at?.split('T')[0]} · {s.payment_method}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: TEALC }}>{fmt(s.total || 0)}</div>
                  {s.is_credit && <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '700' }}>Credit</span>}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <Toast msg={msg} />
    </div>
  )
}
