import { useState, useEffect } from 'react'
import { getStockBatches, addStockBatch, updateStockBatch, deleteStockBatch, transferStock, adjustStock, getEnterpriseLocations, getProducts } from '../../lib/supabase'
import { Card, Inp, TealBtn, GhostBtn } from '../../components/ui'

const STATUSES = ['available', 'reserved', 'damaged', 'returned', 'expired']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

function expiryTone(dateStr) {
  const days = daysUntil(dateStr)
  if (days === null) return null
  if (days < 0) return { label: 'EXPIRED', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  if (days <= 60) return { label: days + ' days left', bg: '#fffbeb', color: '#d97706', border: '#fcd34d' }
  return { label: 'Exp ' + new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }), bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
}

function readAuth() {
  try { return JSON.parse(localStorage.getItem('carehub_auth') || '{}') } catch (e) { return {} }
}

export default function Stock({ brand, showToast }) {
  const authData = readAuth()
  const meName = (authData && authData.staff && authData.staff.full_name)
    ? authData.staff.full_name
    : ((authData && authData.brand && authData.brand.owner) ? authData.brand.owner : 'Owner')

  const [batches, setBatches] = useState([])
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterLoc, setFilterLoc] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const [receiving, setReceiving] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const [transferring, setTransferring] = useState(null)
  const [transferTo, setTransferTo] = useState('')
  const [transferQty, setTransferQty] = useState('')

  const [adjusting, setAdjusting] = useState(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    if (!brand || !brand.id) return
    setLoading(true)
    try {
      const b = await getStockBatches(brand.id)
      const l = await getEnterpriseLocations(brand.id)
      const p = await getProducts(brand.id)
      setBatches(b || [])
      setLocations(l || [])
      setProducts(p || [])
    } catch (e) {
      alert('Could not load stock: ' + e.message)
    }
    setLoading(false)
  }

  const f = (k, v) => setForm(function (prev) { const next = { ...prev }; next[k] = v; return next })

  function locName(id) {
    const l = locations.filter(function (x) { return x.id === id })[0]
    return l ? l.name : 'Unassigned'
  }

  function openReceive() {
    setForm({ date_received: new Date().toISOString().split('T')[0], status: 'available' })
    setReceiving(true)
  }

  async function saveBatch() {
    if (!form.product_name) { alert('Please enter the product name.'); return }
    if (!form.location_id) { alert('Please choose which warehouse this stock is going into.'); return }
    if (!form.quantity || Number(form.quantity) <= 0) { alert('Please enter a quantity greater than zero.'); return }
    setSaving(true)
    try {
      await addStockBatch({
        business_id: brand.id,
        location_id: form.location_id,
        product_id: form.product_id || null,
        product_name: form.product_name,
        batch_number: form.batch_number || null,
        quantity: Number(form.quantity),
        expiry_date: form.expiry_date || null,
        date_received: form.date_received || null,
        supplier_source: form.supplier_source || null,
        storage_location: form.storage_location || null,
        status: form.status || 'available',
        notes: form.notes || null,
        received_by: meName,
      })
      if (showToast) showToast('Stock received')
      setForm({})
      setReceiving(false)
      load()
    } catch (e) {
      alert('Could not save: ' + e.message)
    }
    setSaving(false)
  }

  async function doTransfer() {
    if (!transferTo) { alert('Choose a destination warehouse.'); return }
    if (transferTo === transferring.location_id) { alert('That is the same warehouse it is already in.'); return }
    try {
      await transferStock(transferring, transferTo, transferQty, meName)
      if (showToast) showToast('Stock transferred')
      setTransferring(null)
      setTransferTo('')
      setTransferQty('')
      load()
    } catch (e) {
      alert('Transfer failed: ' + e.message)
    }
  }

  async function doAdjust() {
    if (adjustQty === '') { alert('Enter the corrected quantity.'); return }
    try {
      await adjustStock(adjusting, adjustQty, adjustReason, meName)
      if (showToast) showToast('Stock adjusted')
      setAdjusting(null)
      setAdjustQty('')
      setAdjustReason('')
      load()
    } catch (e) {
      alert('Adjustment failed: ' + e.message)
    }
  }

  async function setStatus(batch, status) {
    try {
      await updateStockBatch(batch.id, { status: status })
      if (showToast) showToast('Marked as ' + status)
      load()
    } catch (e) {
      alert('Could not update: ' + e.message)
    }
  }

  async function removeBatch(batch) {
    if (!window.confirm('Delete this batch record permanently? This cannot be undone.')) return
    try {
      await deleteStockBatch(batch.id)
      if (showToast) showToast('Batch deleted')
      load()
    } catch (e) {
      alert('Could not delete: ' + e.message)
    }
  }

  const visible = batches.filter(function (b) {
    if (filterLoc !== 'all' && b.location_id !== filterLoc) return false
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const inName = (b.product_name || '').toLowerCase().indexOf(q) >= 0
      const inBatch = (b.batch_number || '').toLowerCase().indexOf(q) >= 0
      if (!inName && !inBatch) return false
    }
    return true
  })

  const totalUnits = visible.reduce(function (s, b) { return s + (b.quantity || 0) }, 0)
  const expiringSoon = batches.filter(function (b) {
    const d = daysUntil(b.expiry_date)
    return d !== null && d >= 0 && d <= 60 && b.status === 'available'
  })
  const expired = batches.filter(function (b) {
    const d = daysUntil(b.expiry_date)
    return d !== null && d < 0 && b.status !== 'expired'
  })

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Stock & Batches</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Receive stock into a warehouse, track batch numbers and expiry, transfer between locations.</div>
        </div>
        <TealBtn onClick={openReceive}>+ Receive Stock</TealBtn>
      </div>

      {expired.length > 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626' }}>{expired.length} batch{expired.length > 1 ? 'es have' : ' has'} expired</div>
          <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '2px' }}>Filter by "expired" below, or mark them so they are not dispatched.</div>
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#d97706' }}>{expiringSoon.length} batch{expiringSoon.length > 1 ? 'es expire' : ' expires'} within 60 days</div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>Prioritise these for dispatch.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Batches</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{visible.length}</div>
        </Card>
        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Units</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{totalUnits.toLocaleString()}</div>
        </Card>
        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Warehouses</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>{locations.length}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
        <input value={search} onChange={function (e) { setSearch(e.target.value) }}
          placeholder='Search by product or batch number...'
          style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={filterLoc} onChange={function (e) { setFilterLoc(e.target.value) }}
            style={{ flex: 1, minWidth: '150px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
            <option value='all'>All warehouses</option>
            {locations.map(function (l) {
              return <option key={l.id} value={l.id}>{l.name}</option>
            })}
          </select>

          <select value={filterStatus} onChange={function (e) { setFilterStatus(e.target.value) }}
            style={{ flex: 1, minWidth: '150px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white', textTransform: 'capitalize' }}>
            <option value='all'>All statuses</option>
            {STATUSES.map(function (s) {
              return <option key={s} value={s}>{s}</option>
            })}
          </select>
        </div>
      </div>

      {loading && <div style={{ color: '#888', fontSize: '13px' }}>Loading stock...</div>}

      {!loading && locations.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No warehouses yet</div>
          <div style={{ fontSize: '13px', color: '#888' }}>Add a warehouse under "Warehouses & Branches" first — stock has to go somewhere.</div>
        </Card>
      )}

      {!loading && locations.length > 0 && visible.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            {batches.length === 0 ? 'No stock received yet' : 'Nothing matches those filters'}
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
            {batches.length === 0 ? 'Record your first batch into a warehouse.' : 'Try clearing the search or filters.'}
          </div>
          {batches.length === 0 && <TealBtn onClick={openReceive}>+ Receive Stock</TealBtn>}
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visible.map(function (b) {
          const tone = expiryTone(b.expiry_date)
          return (
            <Card key={b.id} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{b.product_name}</span>
                    {b.batch_number && (
                      <span style={{ fontSize: '10.5px', fontWeight: '700', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                        {b.batch_number}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.03em',
                      background: b.status === 'available' ? '#e7f6f3' : b.status === 'damaged' || b.status === 'expired' ? '#fef2f2' : '#f1f5f9',
                      color: b.status === 'available' ? '#0f766e' : b.status === 'damaged' || b.status === 'expired' ? '#dc2626' : '#64748b' }}>
                      {b.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{(b.quantity || 0).toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>units</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    {locName(b.location_id)}
                    {b.storage_location ? ' · ' + b.storage_location : ''}
                  </div>

                  {b.supplier_source && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>From: {b.supplier_source}</div>
                  )}

                  {b.date_received && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Received {new Date(b.date_received).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {b.received_by ? ' by ' + b.received_by : ''}
                    </div>
                  )}

                  {tone && (
                    <div style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: tone.bg, color: tone.color, border: '1px solid ' + tone.border }}>
                      {tone.label}
                    </div>
                  )}

                  {b.notes && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>{b.notes}</div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button onClick={function () { setTransferring(b); setTransferQty(String(b.quantity)); setTransferTo('') }}
                    style={{ border: '1px solid #ccfbf1', background: '#f0fdfa', color: '#0f766e', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Transfer
                  </button>
                  <button onClick={function () { setAdjusting(b); setAdjustQty(String(b.quantity)); setAdjustReason('') }}
                    style={{ border: '1px solid #e2e8f0', background: 'white', color: '#475569', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Adjust
                  </button>
                  <button onClick={function () { removeBatch(b) }}
                    style={{ border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                {STATUSES.map(function (s) {
                  const on = b.status === s
                  return (
                    <button key={s} onClick={function () { if (!on) setStatus(b, s) }}
                      style={{ fontSize: '10.5px', fontWeight: '700', padding: '5px 10px', borderRadius: '20px', cursor: on ? 'default' : 'pointer', textTransform: 'capitalize',
                        border: on ? '1px solid #0f172a' : '1px solid #e2e8f0',
                        background: on ? '#0f172a' : 'white',
                        color: on ? 'white' : '#94a3b8' }}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {receiving && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Receive Stock</div>
            <div style={{ fontSize: '11.5px', color: '#888', marginBottom: '16px' }}>Recording as <strong>{meName}</strong></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Product *</div>
                <input list='stock-product-list' value={form.product_name || ''}
                  onChange={function (e) {
                    const val = e.target.value
                    f('product_name', val)
                    const match = products.filter(function (p) { return p.name === val })[0]
                    f('product_id', match ? match.id : null)
                  }}
                  placeholder='Type or pick a product'
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                <datalist id='stock-product-list'>
                  {products.map(function (p) { return <option key={p.id} value={p.name} /> })}
                </datalist>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Warehouse *</div>
                <select value={form.location_id || ''} onChange={function (e) { f('location_id', e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value=''>Choose a warehouse</option>
                  {locations.map(function (l) {
                    return <option key={l.id} value={l.id}>{l.name} ({l.location_type})</option>
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Inp label='Quantity *' value={form.quantity} onChange={function (v) { f('quantity', v) }} type='number' placeholder='e.g. 2400' />
                <Inp label='Batch Number' value={form.batch_number} onChange={function (v) { f('batch_number', v) }} placeholder='e.g. EX2216' />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Expiry Date</div>
                  <input type='date' value={form.expiry_date || ''} onChange={function (e) { f('expiry_date', e.target.value) }}
                    style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Date Received</div>
                  <input type='date' value={form.date_received || ''} onChange={function (e) { f('date_received', e.target.value) }}
                    style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <Inp label='Supplier / Source' value={form.supplier_source} onChange={function (v) { f('supplier_source', v) }} placeholder='Who did this come from?' />
              <Inp label='Storage Location' value={form.storage_location} onChange={function (v) { f('storage_location', v) }} placeholder='e.g. Rack B, Shelf 3' />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Status</div>
                <select value={form.status || 'available'} onChange={function (e) { f('status', e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white', textTransform: 'capitalize' }}>
                  {STATUSES.map(function (s) { return <option key={s} value={s}>{s}</option> })}
                </select>
              </div>

              <Inp label='Notes' value={form.notes} onChange={function (v) { f('notes', v) }} placeholder='Anything worth recording' />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setReceiving(false); setForm({}) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={saveBatch} style={{ flex: 2, padding: '13px' }}>{saving ? 'Saving...' : 'Receive Stock'}</TealBtn>
            </div>
          </div>
        </div>
      )}

      {transferring && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Transfer Stock</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              {transferring.product_name} · {transferring.quantity} units in {locName(transferring.location_id)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Move to *</div>
                <select value={transferTo} onChange={function (e) { setTransferTo(e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value=''>Choose destination warehouse</option>
                  {locations.filter(function (l) { return l.id !== transferring.location_id }).map(function (l) {
                    return <option key={l.id} value={l.id}>{l.name} ({l.location_type})</option>
                  })}
                </select>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>How many units? *</div>
                <input type='number' value={transferQty} onChange={function (e) { setTransferQty(e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Move all {transferring.quantity} to relocate the whole batch, or fewer to split it.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setTransferring(null) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={doTransfer} style={{ flex: 2, padding: '13px' }}>Transfer</TealBtn>
            </div>
          </div>
        </div>
      )}

      {adjusting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Adjust Quantity</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              {adjusting.product_name} · currently {adjusting.quantity} units
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Corrected quantity *</div>
                <input type='number' value={adjustQty} onChange={function (e) { setAdjustQty(e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <Inp label='Reason' value={adjustReason} onChange={function (v) { setAdjustReason(v) }} placeholder='e.g. Damaged in transit, recount, breakage' />

              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                Every adjustment is logged with the reason, the amount, and who made it.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setAdjusting(null) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={doAdjust} style={{ flex: 2, padding: '13px' }}>Save Adjustment</TealBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
