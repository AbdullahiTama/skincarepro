import { useState, useEffect } from 'react'
import { addSale, updateSale, getSales, getTodaySales, getSettings, queueOfflineSale, getOfflineQueue, addDebt, updateDebt } from '../../lib/supabase'
import { fmt, genId, todayDate, nowStr, TEAL, TEALC, DARK } from '../../lib/utils'
import { Card, Modal, Pill, GhostBtn, TealBtn, DarkBtn, Inp, Sel, Avatar, Toast, useToast } from '../../components/ui'

export default function POS({ brand, products, setProducts, role, perms }) {
  const [view, setView] = useState('pos') // pos | held | recent | credit
  const [cart, setCart] = useState([])
  const [client, setClient] = useState('Walk-in')
  const [method, setMethod] = useState('Cash')
  const [cash, setCash] = useState('')
  const [disc, setDisc] = useState('')
  const [discPct, setDiscPct] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [settings, setSettings] = useState(null)
  const [todaySales, setTodaySales] = useState([])
  const [heldSales, setHeldSales] = useState([])
  const [creditSales, setCreditSales] = useState([])
  const [allSales, setAllSales] = useState([])
  const [loadingSales, setLoadingSales] = useState(false)
  // Split payment
  const [splitAmounts, setSplitAmounts] = useState({ Cash: '', Transfer: '', POS: '' })
  // Credit
  const [creditAmountPaid, setCreditAmountPaid] = useState('')
  // Hold note
  const [holdNote, setHoldNote] = useState('')
  const [showHoldModal, setShowHoldModal] = useState(false)
  const { msg: toastMsg, show: showToast } = useToast()

  const cats = ['All', ...Array.from(new Set(products.map(p => p.cat)))]
  const visible = products.filter(p =>
    (filter === 'All' || p.cat === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.generic_name || p.genericName || '').toLowerCase().includes(search.toLowerCase()))
  )

  useEffect(() => {
    if (brand?.id) {
      getSettings(brand.id).then(s => setSettings(s))
      loadSalesData()
    }
  }, [brand?.id])

  async function loadSalesData() {
    setLoadingSales(true)
    try {
      const [today, all] = await Promise.all([getTodaySales(brand.id), getSales(brand.id)])
      setTodaySales(today || [])
      setAllSales(all || [])
      setHeldSales((all || []).filter(s => s.is_on_hold))
      setCreditSales((all || []).filter(s => s.is_credit && s.balance > 0))
    } catch (e) {}
    setLoadingSales(false)
  }

  // Cart operations
  const add = p => {
    const f = cart.find(c => c.id === p.id)
    if (f) setCart(cart.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c))
    else setCart([...cart, { ...p, qty: 1 }])
  }
  const rmv = id => setCart(cart.filter(c => c.id !== id))
  const setQty = (id, v) => { const n = parseInt(v) || 0; if (n <= 0) rmv(id); else setCart(cart.map(c => c.id === id ? { ...c, qty: n } : c)) }

  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const discAmt = disc ? (discPct ? Math.round(sub * parseFloat(disc) / 100) : parseFloat(disc) || 0) : 0
  const total = Math.max(0, sub - discAmt)
  const change = method === 'Cash' && cash ? parseFloat(cash) - total : 0
  const splitTotal = method === 'Split' ? Object.values(splitAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0) : 0

  async function saveSale(saleData) {
    try {
      if (navigator.onLine) {
        await addSale({ ...saleData, business_id: brand.id })
      } else {
        queueOfflineSale({ ...saleData, business_id: brand.id })
        showToast('Sale saved offline — will sync when connected')
      }
    } catch (e) {
      queueOfflineSale({ ...saleData, business_id: brand.id })
    }
  }

  async function charge() {
    if (!cart.length) return
    if (method === 'Split' && splitTotal < total) { showToast('Split amounts do not add up to total'); return }
    const txnNo = genId('TXN')
    const clientName = client || 'Walk-in'
    const amtPaid = method === 'Cash' ? parseFloat(cash) || total : method === 'Split' ? splitTotal : total
    const balance = Math.max(0, total - amtPaid)
    const isShortfall = amtPaid < total && method !== 'Credit'

    const saleData = {
      txn_no: txnNo,
      client_name: clientName,
      items: JSON.stringify(cart),
      subtotal: sub,
      discount: discAmt,
      total,
      payment_method: method,
      payment_split: method === 'Split' ? JSON.stringify(splitAmounts) : null,
      amount_paid: amtPaid,
      balance: balance,
      is_credit: isShortfall,
      is_on_hold: false,
    }

    const receiptData = {
      id: txnNo,
      client: clientName,
      items: [...cart],
      subtotal: sub,
      disc: discAmt,
      total,
      method,
      cashGiven: parseFloat(cash) || 0,
      splitAmounts: method === 'Split' ? { ...splitAmounts } : null,
      balance,
    }

    setReceipt(receiptData)
    setProducts(prev => prev.map(p => {
      const s = cart.find(c => c.id === p.id)
      return s && (p.cat || p.category) !== 'Services' ? { ...p, stock: Math.max(0, p.stock - s.qty) } : p
    }))
    await saveSale(saleData)

    // AUTO-CREATE DEBT if amount paid is less than total
    if (balance > 0 && clientName !== 'Walk-in' && brand?.id) {
      try {
        await addDebt({
          business_id: brand.id,
          direction: 'owes_us',
          party_name: clientName,
          amount: total,
          amount_paid: amtPaid,
          balance: balance,
          due_date: '',
          status: 'pending',
          description: isShortfall
            ? 'Shortfall on sale — TXN: ' + txnNo + ' | Items: ' + cart.map(i => i.name + ' x' + i.qty).join(', ')
            : 'Credit sale — TXN: ' + txnNo + ' | Items: ' + cart.map(i => i.name + ' x' + i.qty).join(', '),
          source: 'credit_sale',
          source_ref: txnNo,
        })
        if (balance > 0) showToast('Sale saved! ₦' + balance.toLocaleString() + ' debt recorded for ' + clientName)
      } catch (e) {}
    } else if (balance > 0 && clientName === 'Walk-in') {
      // Walk-in shortfall — still record but as Walk-in
      try {
        await addDebt({
          business_id: brand.id,
          direction: 'owes_us',
          party_name: 'Walk-in — ' + txnNo,
          amount: total,
          amount_paid: amtPaid,
          balance: balance,
          due_date: '',
          status: 'pending',
          description: 'Sale shortfall — TXN: ' + txnNo + ' | Items: ' + cart.map(i => i.name + ' x' + i.qty).join(', '),
          source: 'credit_sale',
          source_ref: txnNo,
        })
      } catch (e) {}
    }

    loadSalesData()
  }

  async function chargeCredit() {
    if (!cart.length) return
    const txnNo = genId('TXN')
    const amtPaid = parseFloat(creditAmountPaid) || 0
    const balance = total - amtPaid
    const clientName = client || 'Walk-in'
    const saleData = {
      txn_no: txnNo,
      client_name: clientName,
      items: JSON.stringify(cart),
      subtotal: sub,
      discount: discAmt,
      total,
      payment_method: 'Credit',
      amount_paid: amtPaid,
      balance,
      is_credit: true,
      is_on_hold: false,
    }
    setReceipt({ id: txnNo, client: clientName, items: [...cart], subtotal: sub, disc: discAmt, total, method: 'Credit', amtPaid, balance })
    setProducts(prev => prev.map(p => { const s = cart.find(c => c.id === p.id); return s && p.cat !== 'Services' ? { ...p, stock: Math.max(0, p.stock - s.qty) } : p }))
    await saveSale(saleData)
    // AUTO-CREATE DEBT: credit sale automatically appears in debts as "Owes Us"
    if (balance > 0 && brand?.id) {
      try {
        await addDebt({
          business_id: brand.id,
          direction: 'owes_us',
          party_name: clientName,
          amount: total,
          amount_paid: amtPaid,
          balance: balance,
          due_date: '',
          status: 'pending',
          description: 'Credit sale — TXN: ' + txnNo,
          source: 'credit_sale',
          source_ref: txnNo,
        })
      } catch (e) {}
    }
    loadSalesData()
  }

  async function holdSale() {
    if (!cart.length) return
    const txnNo = genId('HLD')
    await saveSale({
      txn_no: txnNo,
      client_name: client || 'Walk-in',
      items: JSON.stringify(cart),
      subtotal: sub,
      discount: discAmt,
      total,
      payment_method: 'On Hold',
      amount_paid: 0,
      balance: total,
      is_credit: false,
      is_on_hold: true,
      notes: holdNote,
    })
    showToast('Sale held — resume it from Held Sales')
    setShowHoldModal(false)
    setCart([])
    setClient('Walk-in')
    setHoldNote('')
    loadSalesData()
  }

  async function deleteHeldSale(sale) {
    // Only Owner can delete held sales
    if (role !== 'Owner') { showToast('Only the Owner can delete held sales'); return }
    if (!window.confirm('Delete this held sale? This cannot be undone.')) return
    try {
      await updateSale(sale.id, { is_on_hold: false, status: 'deleted' })
      showToast('Held sale deleted')
      loadSalesData()
    } catch (e) { showToast('Error deleting sale') }
  }

  async function resumeHeld(sale) {
    let items = []
    try { items = JSON.parse(sale.items || '[]') } catch (e) {}
    setCart(items)
    setClient(sale.client_name || 'Walk-in')
    try { await updateSale(sale.id, { is_on_hold: false, status: 'resumed' }) } catch (e) {}
    setView('pos')
    loadSalesData()
  }

  async function collectCredit(sale, amount) {
    const newPaid = (sale.amount_paid || 0) + parseFloat(amount)
    const newBalance = sale.total - newPaid
    await updateSale(sale.id, { amount_paid: newPaid, balance: Math.max(0, newBalance), is_credit: newBalance > 0 })
    // AUTO-UPDATE matching debt
    try {
      const debts = await import('../../lib/supabase').then(m => m.getDebts(brand.id))
      const matchDebt = debts.find(d => d.source === 'credit_sale' && d.source_ref === sale.txn_no && d.status !== 'paid')
      if (matchDebt) {
        await updateDebt(matchDebt.id, { amount_paid: newPaid, balance: Math.max(0, newBalance), status: newBalance <= 0 ? 'paid' : 'pending' })
      }
    } catch (e) {}
    showToast('Payment collected!')
    loadSalesData()
  }

  function newSale() { setReceipt(null); setCart([]); setClient('Walk-in'); setDisc(''); setCash(''); setMethod('Cash'); setSplitAmounts({ Cash: '', Transfer: '', POS: '' }); setCreditAmountPaid('') }

  function printReceipt(r) {
    const biz = brand
    const s = settings || {}
    const w = window.open('', '_blank', 'width=400,height=700')
    const items = r.items || []
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Courier New',monospace}
      body{padding:20px;max-width:320px;margin:auto}
      .c{text-align:center}.b{font-weight:bold}
      hr{border:none;border-top:1px dashed #999;margin:8px 0}
      .r{display:flex;justify-content:space-between;margin:3px 0;font-size:12px}
      .logo{font-size:28px;margin-bottom:4px}
    </style></head><body>
      <div class="c">
        ${s.logo_url ? '<img src="' + s.logo_url + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:8px" />' : '<div class="logo">🏥</div>'}
        <div class="b" style="font-size:16px">${biz?.name || 'CareHub'}</div>
        ${biz?.address ? '<div style="font-size:11px;color:#666;margin-top:2px">' + biz.address + '</div>' : ''}
        ${biz?.phone ? '<div style="font-size:11px;color:#666">' + biz.phone + '</div>' : ''}
        ${biz?.whatsapp ? '<div style="font-size:11px;color:#666">WhatsApp: ' + biz.whatsapp + '</div>' : ''}
        ${s.receipt_header ? '<div style="font-size:11px;margin-top:4px;font-style:italic">' + s.receipt_header + '</div>' : ''}
      </div>
      <hr/>
      <div class="r"><span>Receipt:</span><span>${r.id}</span></div>
      <div class="r"><span>Date:</span><span>${nowStr()}</span></div>
      <div class="r"><span>Client:</span><span>${r.client}</span></div>
      <hr/>
      ${items.map(i => `<div style="margin-bottom:6px"><div class="b" style="font-size:12px">${i.emoji || ''} ${i.name}</div><div class="r" style="color:#666"><span>${i.qty} x ${fmt(i.price)}</span><span>${fmt(i.price * i.qty)}</span></div></div>`).join('')}
      <hr/>
      <div class="r"><span>Subtotal</span><span>${fmt(r.subtotal)}</span></div>
      ${r.disc > 0 ? '<div class="r" style="color:green"><span>Discount</span><span>-' + fmt(r.disc) + '</span></div>' : ''}
      <div class="r b" style="font-size:15px"><span>TOTAL</span><span>${fmt(r.total)}</span></div>
      <div class="r"><span>Payment</span><span>${r.method}</span></div>
      ${r.method === 'Cash' && r.cashGiven ? '<div class="r"><span>Cash Given</span><span>' + fmt(r.cashGiven) + '</span></div><div class="r" style="color:green"><span>Change</span><span>' + fmt(r.cashGiven - r.total) + '</span></div>' : ''}
      ${r.method === 'Credit' ? '<div class="r" style="color:orange"><span>Amount Paid</span><span>' + fmt(r.amtPaid) + '</span></div><div class="r" style="color:red"><span>Balance Owed</span><span>' + fmt(r.balance) + '</span></div>' : ''}
      ${r.splitAmounts ? '<div style="font-size:11px;margin-top:4px">' + Object.entries(r.splitAmounts).filter(([, v]) => parseFloat(v) > 0).map(([k, v]) => k + ': ' + fmt(parseFloat(v))).join(' | ') + '</div>' : ''}
      <hr/>
      ${s.refund_policy ? '<div style="font-size:10px;color:#666;margin-bottom:6px;text-align:center">' + s.refund_policy + '</div><hr/>' : ''}
      <div class="c" style="font-size:11px;color:#999;margin-top:8px">${s.receipt_footer || 'Thank you for your patronage!'}</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 400)
  }

  function startScan() {
    if ('BarcodeDetector' in window) {
      setScanning(true)
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
        const video = document.getElementById('pos-cam')
        if (video) { video.srcObject = stream; video.play() }
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] })
        let found = false
        const interval = setInterval(async () => {
          if (found || !video) return
          try {
            const codes = await detector.detect(video)
            if (codes.length > 0) {
              found = true; clearInterval(interval)
              stream.getTracks().forEach(t => t.stop())
              setScanning(false)
              const code = codes[0].rawValue
              const match = products.find(p => p.barcode === code || p.name.toLowerCase().includes(code.toLowerCase()))
              if (match) { add(match); showToast('Added: ' + match.name) }
              else { setSearch(code) }
            }
          } catch (e) {}
        }, 300)
        setTimeout(() => { if (!found) { clearInterval(interval); stream.getTracks().forEach(t => t.stop()); setScanning(false) } }, 15000)
      }).catch(() => { setScanning(false); showToast('Camera access denied') })
    } else {
      const code = prompt('Enter barcode number:')
      if (code) { const m = products.find(p => p.name.toLowerCase().includes(code.toLowerCase())); if (m) add(m); else setSearch(code) }
    }
  }

  const todayTotal = todaySales.reduce((s, x) => s + (x.total || 0), 0)
  const todayCount = todaySales.length

  // ── RECEIPT VIEW ────────────────────────────────────────────────────────────
  if (receipt) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '20px' }}>
      <Card style={{ width: '100%', maxWidth: '380px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: '900' }}>Sale Complete!</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>#{receipt.id}</div>
        </div>
        <div style={{ padding: '20px' }}>
          {receipt.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span>{it.emoji || '💊'} {it.name} <span style={{ color: '#aaa' }}>×{it.qty}</span></span>
              <span style={{ fontWeight: '700' }}>{fmt(it.price * it.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #ddd', marginTop: '12px', paddingTop: '12px' }}>
            {receipt.disc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '4px' }}><span>Discount</span><span>-{fmt(receipt.disc)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: '900' }}><span>TOTAL</span><span style={{ color: TEALC }}>{fmt(receipt.total)}</span></div>
            {receipt.method === 'Cash' && receipt.cashGiven > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#059669', marginTop: '6px' }}><span>Change</span><span>{fmt(receipt.cashGiven - receipt.total)}</span></div>
            )}
            {receipt.method === 'Credit' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#d97706', marginTop: '4px' }}><span>Paid Now</span><span>{fmt(receipt.amtPaid)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc2626', fontWeight: '700' }}><span>Balance Owed</span><span>{fmt(receipt.balance)}</span></div>
              </>
            )}
            {receipt.method === 'Split' && receipt.splitAmounts && (
              <div style={{ marginTop: '6px', padding: '8px', borderRadius: '8px', background: '#f9fafb', fontSize: '12px' }}>
                {Object.entries(receipt.splitAmounts).filter(([, v]) => parseFloat(v) > 0).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{k}</span><span style={{ fontWeight: '700' }}>{fmt(parseFloat(v))}</span></div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => printReceipt(receipt)} style={{ padding: '13px', borderRadius: '12px', border: 'none', background: TEAL, color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
            🖨️ Print Receipt
          </button>
          <button onClick={newSale} style={{ padding: '11px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '700', cursor: 'pointer' }}>
            + New Sale
          </button>
        </div>
      </Card>
      <Toast msg={toastMsg} />
    </div>
  )

  // ── HELD SALES VIEW ──────────────────────────────────────────────────────────
  if (view === 'held') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setView('pos')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: '600' }}>← Back to POS</button>
        <div style={{ fontWeight: '800', fontSize: '16px' }}>Held Sales ({heldSales.length})</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {heldSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ccc' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏸</div>
            <div>No held sales</div>
          </div>
        ) : heldSales.map(s => {
          let items = []; try { items = JSON.parse(s.items || '[]') } catch (e) {}
          return (
            <Card key={s.id} style={{ padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{s.client_name || 'Walk-in'}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{items.length} item(s) · {fmt(s.total)}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{s.created_at?.replace('T', ' ').slice(0, 16)}</div>
                  {s.notes && <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', fontStyle: 'italic' }}>Note: {s.notes}</div>}
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {items.map((it, i) => <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#f0fdfa', color: '#0f766e', fontWeight: '600' }}>{it.name} ×{it.qty}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <TealBtn onClick={() => resumeHeld(s)} style={{ padding: '8px 16px' }}>▶ Resume Sale</TealBtn>
                  {role === 'Owner' && (
                    <button onClick={() => deleteHeldSale(s)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <Toast msg={toastMsg} />
    </div>
  )

  // ── RECENT SALES VIEW ────────────────────────────────────────────────────────
  if (view === 'recent') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setView('pos')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: '600' }}>← Back to POS</button>
        <div style={{ fontWeight: '800', fontSize: '16px' }}>Recent Sales</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {allSales.filter(s => !s.is_on_hold).slice(0, 50).map(s => {
          let items = []; try { items = JSON.parse(s.items || '[]') } catch (e) {}
          return (
            <Card key={s.id} style={{ padding: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{s.client_name || 'Walk-in'}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.txn_no} · {items.length} item(s) · {s.payment_method}</div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{s.created_at?.replace('T', ' ').slice(0, 16)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: TEALC }}>{fmt(s.total)}</div>
                    {s.is_credit && <Pill label='Credit' type='amber' />}
                  </div>
                  <button onClick={() => {
                    const receiptData = { id: s.txn_no, client: s.client_name, items, subtotal: s.subtotal, disc: s.discount, total: s.total, method: s.payment_method, cashGiven: 0 }
                    printReceipt(receiptData)
                  }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                    🖨️ Reprint
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <Toast msg={toastMsg} />
    </div>
  )

  // ── CREDIT SALES VIEW ────────────────────────────────────────────────────────
  if (view === 'credit') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setView('pos')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: '600' }}>← Back to POS</button>
        <div style={{ fontWeight: '800', fontSize: '16px' }}>Credit Sales ({creditSales.length})</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {creditSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ccc' }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>💳</div><div>No outstanding credit sales</div></div>
        ) : creditSales.map(s => (
          <Card key={s.id} style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px' }}>{s.client_name || 'Walk-in'}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{s.txn_no} · Total: {fmt(s.total)}</div>
                <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>Paid: {fmt(s.amount_paid || 0)}</div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#dc2626', marginTop: '2px' }}>Balance: {fmt(s.balance || 0)}</div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{s.created_at?.split('T')[0]}</div>
              </div>
              <CollectPayment sale={s} onCollect={collectCredit} />
            </div>
          </Card>
        ))}
      </div>
      <Toast msg={toastMsg} />
    </div>
  )

  // ── MAIN POS VIEW ────────────────────────────────────────────────────────────
  const outOfStockItems = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock <= 0)
  const lowStockItems = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top bar with daily summary */}
      <div style={{ background: DARK, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ color: 'white' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Today's Sales</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#14b8a6' }}>{fmt(todayTotal)}</div>
          </div>
          <div style={{ color: 'white' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Transactions</span>
            <div style={{ fontSize: '20px', fontWeight: '900' }}>{todayCount}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[['⏸ Held', 'held', heldSales.length], ['🕐 Recent', 'recent', 0], ['💳 Credit', 'credit', creditSales.length]].map(([label, v, count]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {label} {count > 0 && <span style={{ background: '#14b8a6', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Alert Banners — visible to ALL staff at POS */}
      {outOfStockItems.length > 0 && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #fecaca', padding: '8px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px' }}>🔴</span>
            <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '12px' }}>OUT OF STOCK ({outOfStockItems.length}):</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {outOfStockItems.map(p => (
                <span key={p.id} style={{ padding: '2px 8px', borderRadius: '6px', background: '#fecaca', color: '#dc2626', fontSize: '11px', fontWeight: '700' }}>
                  {p.emoji || '📦'} {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {lowStockItems.length > 0 && (
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d', padding: '6px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px' }}>🟡</span>
            <span style={{ fontWeight: '700', color: '#d97706', fontSize: '11px' }}>LOW STOCK ({lowStockItems.length}):</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {lowStockItems.map(p => (
                <span key={p.id} style={{ padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '600' }}>
                  {p.emoji || '📦'} {p.name} ({p.stock} left)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Products panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search product or generic name...'
              style={{ flex: 1, minWidth: '140px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
            <button onClick={startScan} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📷</button>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {cats.map(c => <button key={c} onClick={() => setFilter(c)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px', background: filter === c ? '#0f766e' : '#f0f0f0', color: filter === c ? 'white' : '#666' }}>{c}</button>)}
            </div>
          </div>
          {scanning && (
            <div style={{ margin: '10px 12px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #0f766e', position: 'relative', background: 'black' }}>
              <video id='pos-cam' style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} autoPlay playsInline muted />
              <button onClick={() => { setScanning(false); const v = document.getElementById('pos-cam'); if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null } }}
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>Stop</button>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '8px', alignContent: 'start' }}>
            {visible.map(p => {
              const inCart = cart.find(c => c.id === p.id)
              const qty = inCart?.qty || 0
              const out = p.cat !== 'Services' && p.stock <= 0
              return (
                <button key={p.id} onClick={() => !out && add(p)} disabled={out}
                  style={{ background: 'white', border: qty > 0 ? '2px solid #0f766e' : '2px solid transparent', borderRadius: '14px', padding: '12px', cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.4 : 1, textAlign: 'left', position: 'relative', boxShadow: qty > 0 ? '0 2px 8px rgba(15,118,110,0.2)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {qty > 0 && <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', borderRadius: '50%', background: '#0f766e', color: 'white', fontWeight: '900', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{qty}</div>}
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{p.emoji || '📦'}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#111', marginBottom: '2px', lineHeight: '1.3' }}>{p.name}</div>
                  {(p.generic_name || p.genericName) && <div style={{ fontSize: '9px', color: '#bbb', marginBottom: '4px' }}>{p.generic_name || p.genericName}</div>}
                  <div style={{ fontSize: '13px', fontWeight: '900', color: TEALC }}>{fmt(p.price)}</div>
                  {p.cat !== 'Services' && <div style={{ fontSize: '9px', color: out ? '#ef4444' : '#bbb', marginTop: '2px' }}>{out ? 'Out of stock' : p.stock + ' left'}</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cart panel */}
        <div style={{ width: '280px', flexShrink: 0, background: 'white', borderLeft: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#bbb', letterSpacing: '1.5px', marginBottom: '6px' }}>CLIENT</div>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder='Walk-in Client'
              style={{ width: '100%', padding: '7px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', color: '#ddd', textAlign: 'center', gap: '6px' }}>
                <div style={{ fontSize: '32px' }}>🛒</div>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>Cart empty</div>
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ padding: '8px 12px', borderBottom: '1px solid #f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>{fmt(item.price)} each</div>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '13px', marginLeft: '6px' }}>{fmt(item.price * item.qty)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => setQty(item.id, item.qty - 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>−</button>
                  <input type='number' value={item.qty} onChange={e => setQty(item.id, e.target.value)} style={{ width: '36px', textAlign: 'center', padding: '2px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', fontWeight: '700', outline: 'none' }} />
                  <button onClick={() => setQty(item.id, item.qty + 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '14px', color: 'white' }}>+</button>
                  <button onClick={() => rmv(item.id)} style={{ marginLeft: 'auto', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals and payment */}
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 12px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {/* Discount */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ display: 'flex', borderRadius: '7px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <button onClick={() => setDiscPct(false)} style={{ padding: '5px 8px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '11px', background: !discPct ? '#0f766e' : 'white', color: !discPct ? 'white' : '#888' }}>₦</button>
                <button onClick={() => setDiscPct(true)} style={{ padding: '5px 8px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '11px', background: discPct ? '#0f766e' : 'white', color: discPct ? 'white' : '#888' }}>%</button>
              </div>
              <input value={disc} onChange={e => setDisc(e.target.value)} placeholder='Discount'
                style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }} />
            </div>

            {/* Summary */}
            <div style={{ background: 'white', borderRadius: '8px', padding: '8px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '2px' }}><span>Subtotal</span><span>{fmt(sub)}</span></div>
              {discAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#059669', marginBottom: '2px' }}><span>Discount</span><span>-{fmt(discAmt)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '900', borderTop: '1px solid #f0f0f0', paddingTop: '5px', marginTop: '3px' }}><span>Total</span><span style={{ color: TEALC }}>{fmt(total)}</span></div>
            </div>

            {/* Payment method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['Cash', 'Transfer', 'POS', 'Split', 'Credit'].map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  style={{ padding: '6px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px', background: method === m ? '#0f766e' : '#f0f0f0', color: method === m ? 'white' : '#666' }}>
                  {m === 'Cash' ? '💵' : m === 'Transfer' ? '🏦' : m === 'POS' ? '💳' : m === 'Split' ? '✂️' : '📝'} {m}
                </button>
              ))}
            </div>

            {/* Cash input */}
            {method === 'Cash' && (
              <div>
                <input type='number' value={cash} onChange={e => setCash(e.target.value)} placeholder='Cash given (₦)'
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                {cash && <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', color: change >= 0 ? '#059669' : '#ef4444' }}>{change >= 0 ? 'Change: ' + fmt(change) : 'Short: ' + fmt(Math.abs(change))}</div>}
              </div>
            )}

            {/* Split payment inputs */}
            {method === 'Split' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Cash', 'Transfer', 'POS'].map(m => (
                  <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', width: '55px', color: '#555' }}>{m}</span>
                    <input type='number' value={splitAmounts[m]} onChange={e => setSplitAmounts(prev => ({ ...prev, [m]: e.target.value }))}
                      placeholder='0' style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }} />
                  </div>
                ))}
                <div style={{ fontSize: '11px', fontWeight: '700', color: splitTotal >= total ? '#059669' : '#ef4444', textAlign: 'right' }}>
                  {splitTotal >= total ? 'Balanced' : 'Short: ' + fmt(total - splitTotal)}
                </div>
              </div>
            )}

            {/* Credit input */}
            {method === 'Credit' && (
              <div>
                <input type='number' value={creditAmountPaid} onChange={e => setCreditAmountPaid(e.target.value)} placeholder='Amount paid now (₦)'
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                {creditAmountPaid && <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px', color: '#dc2626' }}>Balance owed: {fmt(total - (parseFloat(creditAmountPaid) || 0))}</div>}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setShowHoldModal(true)} disabled={!cart.length}
                style={{ padding: '8px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '700', fontSize: '11px', cursor: cart.length ? 'pointer' : 'not-allowed', opacity: cart.length ? 1 : 0.4 }}>
                ⏸ Hold
              </button>
              <button onClick={method === 'Credit' ? chargeCredit : charge} disabled={!cart.length}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: cart.length ? TEAL : '#e5e7eb', color: cart.length ? 'white' : '#bbb', fontWeight: '900', fontSize: '13px', cursor: cart.length ? 'pointer' : 'not-allowed' }}>
                {cart.length ? (method === 'Credit' ? 'Credit Sale' : 'Charge ' + fmt(total)) : 'Select products'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hold modal */}
      <Modal show={showHoldModal} onClose={() => setShowHoldModal(false)} title='Hold Sale'
        footer={<><GhostBtn onClick={() => setShowHoldModal(false)} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={holdSale} style={{ flex: 1, padding: '12px' }}>Hold Sale</TealBtn></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: '#f9fafb', fontSize: '13px', color: '#555' }}>
            Cart total: <strong>{fmt(total)}</strong> · {cart.length} item(s) for <strong>{client || 'Walk-in'}</strong>
          </div>
          <Inp label='Note (optional)' value={holdNote} onChange={setHoldNote} placeholder='e.g. Customer coming back in 30 minutes' />
        </div>
      </Modal>

      <Toast msg={toastMsg} />
    </div>
  )
}

// Collect payment component for credit sales
function CollectPayment({ sale, onCollect }) {
  const [amount, setAmount] = useState('')
  const [collecting, setCollecting] = useState(false)

  const handleCollect = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setCollecting(true)
    await onCollect(sale, amount)
    setAmount('')
    setCollecting(false)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <input type='number' value={amount} onChange={e => setAmount(e.target.value)} placeholder='Amount'
        style={{ width: '90px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', outline: 'none' }} />
      <TealBtn onClick={handleCollect} style={{ padding: '6px 12px', fontSize: '12px' }}>{collecting ? '...' : 'Collect'}</TealBtn>
    </div>
  )
}
