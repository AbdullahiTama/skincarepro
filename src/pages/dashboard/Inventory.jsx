import { useState, useEffect } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, deleteProductsBulk } from '../../lib/supabase'
import { fmt, todayDate, TEAL, TEALC, PRODUCT_CATS, PRODUCT_EMOJIS } from '../../lib/utils'
import { Card, StatCard, SectionHead, Modal, Pill, Inp, Sel, Textarea, Toggle, GhostBtn, TealBtn, RedBtn, Loading, Empty, useToast, Toast } from '../../components/ui'

// Normalize text for duplicate comparison — lowercase, trim, collapse spaces, strip punctuation
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

// Find an existing product that matches by brand name OR generic name (normalized)
function findDuplicate(existingProducts, name, genericName, excludeId) {
  const nName = normalize(name)
  const nGeneric = normalize(genericName)
  if (!nName && !nGeneric) return null
  return existingProducts.find(p => {
    if (excludeId && p.id === excludeId) return false
    const pName = normalize(p.name)
    const pGeneric = normalize(p.generic_name || p.genericName)
    const nameMatch = nName && pName && nName === pName
    const genericMatch = nGeneric && pGeneric && nGeneric === pGeneric
    return nameMatch || genericMatch
  }) || null
}

// Scan the full product list and group items that match each other by name or generic name.
// Returns an array of groups, each group is an array of 2+ products considered duplicates of each other.
function findAllDuplicateGroups(allProducts) {
  const visited = new Set()
  const groups = []
  for (let i = 0; i < allProducts.length; i++) {
    const a = allProducts[i]
    if (visited.has(a.id)) continue
    const nNameA = normalize(a.name)
    const nGenericA = normalize(a.generic_name || a.genericName)
    const group = [a]
    for (let j = i + 1; j < allProducts.length; j++) {
      const b = allProducts[j]
      if (visited.has(b.id)) continue
      const nNameB = normalize(b.name)
      const nGenericB = normalize(b.generic_name || b.genericName)
      const nameMatch = nNameA && nNameB && nNameA === nNameB
      const genericMatch = nGenericA && nGenericB && nGenericA === nGenericB
      if (nameMatch || genericMatch) {
        group.push(b)
        visited.add(b.id)
      }
    }
    if (group.length > 1) {
      visited.add(a.id)
      groups.push(group)
    }
  }
  return groups
}

export default function Inventory({ brand, products, setProducts, role, perms, loadProducts }) {
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showRestock, setShowRestock] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadData, setUploadData] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [showCleanup, setShowCleanup] = useState(false)
  const [cleaningUp, setCleaningUp] = useState(false)
  const { msg: toastMsg, show: showToast } = useToast()

  const duplicateGroups = findAllDuplicateGroups(products)
  const totalDuplicateItems = duplicateGroups.reduce((s, g) => s + (g.length - 1), 0)

  const cats = ['All', ...Array.from(new Set(products.map(p => p.cat || p.category)))]
  const filtered = products.filter(p => {
    const pCat = p.cat || p.category || ''
    const pGeneric = p.generic_name || p.genericName || ''
    return (catFilter === 'All' || pCat === catFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || pGeneric.toLowerCase().includes(search.toLowerCase()))
  })
  const lowStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5))
  const outOfStock = products.filter(p => (p.cat || p.category) !== 'Services' && p.stock <= 0)
  const stockValue = products.filter(p => (p.cat || p.category) !== 'Services').reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0)
  const costValue = products.filter(p => (p.cat || p.category) !== 'Services').reduce((s, p) => s + (p.cost_price || 0) * (p.stock || 0), 0)
  const onCareFind = products.filter(p => p.list_on_carefind !== false && p.stock > 0).length

  async function reload() {
    try {
      const p = await getProducts(brand.id)
      if (Array.isArray(p)) setProducts(p)
      if (loadProducts) loadProducts()
    } catch (e) {
      console.error('reload error:', e)
    }
  }

  async function saveProduct(data, isEdit) {
    try {
      const category = data.cat || data.category || 'Medicines'
      // Build clean productData — explicitly exclude 'cat' since Supabase only has 'category'
      const { cat, ...rest } = data
      const productData = {
        ...rest,
        category,
        price: parseFloat(data.price) || 0,
        cost_price: parseFloat(data.cost_price) || 0,
        stock: category === 'Services' ? 999 : parseInt(data.stock) || 0,
        reorder_level: parseInt(data.reorder_level) || 5,
        // Blank optional fields must be null. An empty string sent to a
        // numeric column makes Postgres reject the whole insert.
        min_purchase: (data.min_purchase === '' || data.min_purchase == null) ? null : (parseInt(data.min_purchase) || null),
        sale_type: data.sale_type || null,
        shelf: data.shelf || null,
        sales_unit: data.sales_unit || null,
        price_unit: data.price_unit || data.sales_unit || null,
      }

      if (!isEdit) {
        // Check for duplicate — but only if name is specific enough (more than 3 chars)
        const name = (productData.name || '').trim()
        const generic = (productData.generic_name || '').trim()
        if (name.length > 3) {
          const dupe = findDuplicate(products, name, generic, null)
          if (dupe) {
            // Close the add form first — otherwise the warning opens behind it
            // and it looks like the save silently did nothing.
            setShowAdd(false)
            setEditItem(null)
            setDuplicateWarning({ existing: dupe, incoming: productData })
            return
          }
        }
      }

      if (isEdit) {
        await updateProduct(data.id, productData)
        showToast('Product updated!')
      } else {
        await addProduct({ ...productData, business_id: brand.id })
        showToast('Product added! ✅')
      }
      await reload()
    } catch (e) {
      console.error('saveProduct error:', e)
      alert('Could not save product:\n\n' + (e.message || 'Unknown error'))
    }
  }

  // The name looked similar but it really is a different product — save it as new.
  async function addNewAnyway() {
    if (!duplicateWarning) return
    try {
      await addProduct({ ...duplicateWarning.incoming, business_id: brand.id })
      showToast('Product added! \u2705')
      setDuplicateWarning(null)
      setShowAdd(false)
      setEditItem(null)
      await reload()
    } catch (e) {
      alert('Could not save product:\n\n' + (e.message || 'Unknown error'))
    }
  }

  // Called when user confirms they want to update the existing duplicate instead of creating new
  async function updateExistingFromDuplicate() {
    if (!duplicateWarning) return
    try {
      const { existing, incoming } = duplicateWarning
      await updateProduct(existing.id, {
        price: incoming.price,
        cost_price: incoming.cost_price,
        stock: (existing.stock || 0) + (incoming.stock || 0),
        reorder_level: incoming.reorder_level,
        category: incoming.category,
        barcode: incoming.barcode || existing.barcode,
        list_on_carefind: incoming.list_on_carefind,
      })
      showToast('Existing product updated — stock combined!')
      setDuplicateWarning(null)
      setShowAdd(false)
      setEditItem(null)
      await reload()
    } catch (e) { alert('Could not update product:\n\n' + (e.message || 'Unknown error')) }
  }

  // Merge ALL detected duplicate groups in one go — batched version:
  // updates and deletes run in safe-sized parallel batches to avoid overwhelming
  // the connection or hitting URL length limits with very large duplicate counts
  async function mergeAllDuplicates() {
    setCleaningUp(true)
    try {
      const idsToDelete = []
      const updates = [] // { id, stock }

      for (const group of duplicateGroups) {
        // Pick the "keeper" — prefer the one with a cost_price set, then the one with more stock, then the first
        const keeper = [...group].sort((a, b) => {
          const aScore = (a.cost_price > 0 ? 2 : 0) + (a.barcode ? 1 : 0)
          const bScore = (b.cost_price > 0 ? 2 : 0) + (b.barcode ? 1 : 0)
          if (aScore !== bScore) return bScore - aScore
          return (b.stock || 0) - (a.stock || 0)
        })[0]
        const others = group.filter(p => p.id !== keeper.id)
        const combinedStock = group.reduce((s, p) => s + (p.stock || 0), 0)

        updates.push({ id: keeper.id, stock: combinedStock })
        others.forEach(o => idsToDelete.push(o.id))
      }

      // Run stock updates in parallel batches of 25 at a time (not all 900+ at once)
      const UPDATE_BATCH_SIZE = 25
      for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
        const batch = updates.slice(i, i + UPDATE_BATCH_SIZE)
        await Promise.all(batch.map(u => updateProduct(u.id, { stock: u.stock })))
        showToast('Updating products... ' + Math.min(i + UPDATE_BATCH_SIZE, updates.length) + ' / ' + updates.length)
      }

      // Delete duplicates in batches of 50 IDs per request to keep the URL short and safe
      const DELETE_BATCH_SIZE = 50
      let deletedSoFar = 0
      for (let i = 0; i < idsToDelete.length; i += DELETE_BATCH_SIZE) {
        const batch = idsToDelete.slice(i, i + DELETE_BATCH_SIZE)
        await deleteProductsBulk(batch)
        deletedSoFar += batch.length
        showToast('Removing duplicates... ' + deletedSoFar + ' / ' + idsToDelete.length)
      }

      await reload()
      showToast('Cleaned up ' + duplicateGroups.length + ' duplicate group(s) — removed ' + idsToDelete.length + ' duplicate item(s)')
    } catch (e) {
      console.error('Error during cleanup:', e)
      showToast('Error during cleanup — please try again. (' + (e.message || 'unknown error') + ')')
    }
    setCleaningUp(false)
    setShowCleanup(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    try { await deleteProduct(id); await reload(); showToast('Product deleted') } catch (e) {}
  }

  async function handleRestock(product, qty, note) {
    try {
      await updateProduct(product.id, { stock: (product.stock || 0) + parseInt(qty) })
      await reload()
      showToast(qty + ' units added to ' + product.name)
    } catch (e) { showToast('Error updating stock') }
  }

  async function toggleCareFind(product) {
    try {
      await updateProduct(product.id, { list_on_carefind: !product.list_on_carefind })
      await reload()
    } catch (e) {}
  }

  function downloadTemplate() {
    const rows = [
      ['Product Name', 'Generic Name', 'Category', 'Selling Price (NGN)', 'Cost Price (NGN)', 'Stock Quantity', 'Reorder Level', 'Barcode', 'List on CareFind (yes/no)'],
      ['Amoxicillin 500mg', 'Amoxicillin', 'Medicines', '1500', '800', '100', '20', '', 'yes'],
      ['Paracetamol 500mg', 'Paracetamol', 'Medicines', '800', '400', '200', '30', '', 'yes'],
      ['Consultation Fee', 'Medical Consultation', 'Services', '5000', '0', '', '0', '', 'yes'],
    ]
    const csv = rows.map(r => r.map(c => '"' + c + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'CareHub_Inventory_Template.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Template downloaded! Fill in Excel, save as CSV, then upload.')
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]; if (!file) return
    setUploadError(''); setUploadData([])
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const lines = ev.target.result.split('\n').filter(l => l.trim())
        if (lines.length < 2) { setUploadError('File is empty or has no products.'); return }
        const parsed = lines.slice(1).map(line => {
          const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim())
          if (!cols[0]) return null
          return {
            name: cols[0] || '',
            generic_name: cols[1] || '',
            category: cols[2] || 'Medicines',
            price: parseFloat(cols[3]) || 0,
            cost_price: parseFloat(cols[4]) || 0,
            stock: cols[5] !== '' ? parseInt(cols[5]) || 0 : 999,
            reorder_level: parseInt(cols[6]) || 5,
            barcode: cols[7] || '',
            list_on_carefind: (cols[8] || 'yes').toLowerCase() !== 'no',
            emoji: '💊',
          }
        }).filter(Boolean)
        if (parsed.length === 0) { setUploadError('No valid products found.'); return }
        setUploadData(parsed)
      } catch (err) { setUploadError('Error reading file. Use the downloaded template.') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  async function confirmUpload() {
    let count = 0
    for (const p of uploadData) {
      try {
        const { cat, ...cleanP } = p
        await addProduct({ ...cleanP, category: p.category || p.cat || 'Medicines', business_id: brand.id })
        count++
      } catch (e) { console.error('Upload error:', e.message) }
    }
    await reload()
    showToast(count + ' products imported successfully!')
    setUploadData([])
    setShowUpload(false)
  }

  function startScan() {
    if ('BarcodeDetector' in window) {
      setScanning(true)
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
        const video = document.getElementById('inv-cam')
        if (video) { video.srcObject = stream; video.play() }
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a'] })
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
              const match = products.find(p => p.barcode === code)
              if (match) { setEditItem(match); showToast('Found: ' + match.name) }
              else { setSearch(code); showToast('Barcode: ' + code) }
            }
          } catch (e) {}
        }, 300)
        setTimeout(() => { if (!found) { clearInterval(interval); stream.getTracks().forEach(t => t.stop()); setScanning(false) } }, 15000)
      }).catch(() => { setScanning(false); showToast('Camera access denied') })
    } else {
      const code = prompt('Enter barcode:')
      if (code) { const m = products.find(p => p.barcode === code); if (m) setEditItem(m); else setSearch(code) }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div><div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>Inventory</div><div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>Manage products, stock and CareFind listings</div></div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={downloadTemplate} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#059669', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📥 Template</button>
          <button onClick={() => setShowUpload(true)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📤 Upload CSV</button>
          {totalDuplicateItems > 0 && (
            <button onClick={() => setShowCleanup(true)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #fcd34d', background: '#fffbeb', color: '#d97706', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              ⚠️ Clean Up {totalDuplicateItems} Duplicate{totalDuplicateItems > 1 ? 's' : ''}
            </button>
          )}
          {perms?.canEditStock && <TealBtn onClick={() => setShowAdd(true)}>+ Add Product</TealBtn>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='📦' label='Total Products' value={products.length} />
        <StatCard icon='⚠️' label='Low Stock' value={lowStock.length} alert={lowStock.length > 0} sub={outOfStock.length + ' out of stock'} />
        <StatCard icon='💰' label='Stock Value' value={fmt(stockValue)} sub={'Cost: ' + fmt(costValue)} />
        <StatCard icon='🔍' label='On CareFind' value={onCareFind} sub='Visible to public' />
      </div>

      {lowStock.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '14px', background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div><div style={{ fontWeight: '700', color: '#92400e', fontSize: '14px' }}>{lowStock.length} item(s) running low</div><div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>{lowStock.map(p => p.name).join(' · ')}</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search name or generic name...'
          style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        <button onClick={startScan} style={{ padding: '9px 14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>📷 Scan</button>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {cats.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '7px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', background: catFilter === c ? '#0f766e' : '#f3f4f6', color: catFilter === c ? 'white' : '#666' }}>{c}</button>)}
        </div>
      </div>

      {scanning && (
        <div style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #0f766e', position: 'relative', background: 'black' }}>
          <video id='inv-cam' style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} autoPlay playsInline muted />
          <button onClick={() => { setScanning(false); const v = document.getElementById('inv-cam'); if (v?.srcObject) { v.srcObject.getTracks().forEach(t => t.stop()); v.srcObject = null } }}
            style={{ position: 'absolute', top: '8px', right: '8px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Stop</button>
        </div>
      )}

      {filtered.length === 0 ? <Empty icon='📦' message='No products found' action={perms?.canEditStock ? '+ Add First Product' : undefined} onAction={() => setShowAdd(true)} /> : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f5f5f5', background: '#fafafa' }}>
                  {['Product', 'Generic Name', 'Cat', 'Sell Price', 'Cost Price', 'Margin', 'Stock', 'CareFind', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cat = p.cat || p.category || ''
                  const low = cat !== 'Services' && p.stock > 0 && p.stock <= (p.reorder_level || 5)
                  const out = cat !== 'Services' && p.stock <= 0
                  const margin = p.price && p.cost_price ? Math.round(((p.price - p.cost_price) / p.price) * 100) : null
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9', background: out ? '#fff5f5' : low ? '#fffbeb' : 'white' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{p.emoji || '📦'}</span>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</div>
                            {p.shelf && <div style={{ fontSize: '11px', color: '#0f766e', fontWeight: '700', marginTop: '2px' }}>📍 {p.shelf}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888' }}>{p.generic_name || p.genericName || '—'}</td>
                      <td style={{ padding: '12px 14px' }}><Pill label={cat} type='teal' /></td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700' }}>{fmt(p.price)}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#888' }}>{p.cost_price ? fmt(p.cost_price) : '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: margin !== null ? (margin > 30 ? '#059669' : '#d97706') : '#bbb' }}>
                        {margin !== null ? margin + '%' : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '900', color: out ? '#ef4444' : low ? '#f59e0b' : '#111' }}>
                        {cat === 'Services' ? '∞' : p.stock}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => toggleCareFind(p)}
                          style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative', background: p.list_on_carefind !== false ? '#0f766e' : '#e5e7eb' }}>
                          <div style={{ position: 'absolute', top: '2px', left: p.list_on_carefind !== false ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {cat === 'Services' ? <Pill label='Service' type='blue' /> : out ? <Pill label='Out of Stock' type='red' /> : low ? <Pill label='Low Stock' type='amber' /> : <Pill label='In Stock' type='green' />}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {cat !== 'Services' && <button onClick={() => setShowRestock(p)} style={{ padding: '4px 8px', borderRadius: '7px', border: 'none', background: '#059669', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>+Stock</button>}
                          <GhostBtn onClick={() => setEditItem(p)}>Edit</GhostBtn>
                          {perms?.canDelete && <RedBtn onClick={() => handleDelete(p.id)}>Del</RedBtn>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Product Modal */}
      {(showAdd || editItem) && (
        <ProductModal
          product={editItem}
          perms={perms}
          onSave={async (data) => { await saveProduct(data, !!editItem); setShowAdd(false); setEditItem(null) }}
          onClose={() => { setShowAdd(false); setEditItem(null) }}
        />
      )}

      {/* Restock Modal */}
      {showRestock && (
        <RestockModal
          product={showRestock}
          onRestock={async (qty, note) => { await handleRestock(showRestock, qty, note); setShowRestock(null) }}
          onClose={() => setShowRestock(null)}
        />
      )}

      {/* Upload Modal */}
      <Modal show={showUpload} onClose={() => { setShowUpload(false); setUploadData([]); setUploadError('') }} title='Upload Products from Excel / CSV'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '13px', color: '#0f766e', lineHeight: '1.9' }}>
            1. Tap <strong>Download Template</strong><br />
            2. Open in <strong>Microsoft Excel</strong> or Google Sheets<br />
            3. Fill in your products row by row<br />
            4. Save as <strong>CSV</strong><br />
            5. Upload here
          </div>
          <label style={{ display: 'block', padding: '24px', borderRadius: '12px', border: '2px dashed #e5e7eb', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontWeight: '700', color: '#555', fontSize: '14px' }}>Tap to select CSV file</div>
            <input type='file' accept='.csv,.xlsx,.xls,.txt' onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          {uploadError && <div style={{ padding: '12px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626' }}>⚠️ {uploadError}</div>}
          {uploadData.length > 0 && (
            <div>
              <div style={{ fontWeight: '700', color: '#059669', fontSize: '13px', marginBottom: '8px' }}>
                ✅ {uploadData.length} products in file
                {uploadData.filter(p => findDuplicate(products, p.name, p.generic_name)).length > 0 && (
                  <span style={{ color: '#d97706', fontWeight: '600' }}> · {uploadData.filter(p => findDuplicate(products, p.name, p.generic_name)).length} already exist (will be skipped)</span>
                )}
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                {uploadData.map((p, i) => {
                  const isDupe = !!findDuplicate(products, p.name, p.generic_name)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #f9f9f9', fontSize: '12px', background: isDupe ? '#fffbeb' : 'transparent' }}>
                      <span style={{ fontWeight: '600', color: isDupe ? '#d97706' : '#111' }}>
                        {isDupe && '⚠️ '}{p.name}
                      </span>
                      <span style={{ color: isDupe ? '#d97706' : '#888' }}>
                        {isDupe ? 'Already exists' : p.category + ' · ₦' + p.price + ' · ' + p.stock + ' units'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={downloadTemplate} style={{ flex: 1, padding: '12px' }}>📥 Download Template</GhostBtn>
            {uploadData.length > 0 && (
              <button onClick={async () => {
                showToast('Importing ' + uploadData.length + ' products...')
                let added = 0
                let skipped = 0
                const skippedNames = []
                for (const p of uploadData) {
                  const dupe = findDuplicate(products, p.name, p.generic_name)
                  if (dupe) {
                    skipped++
                    skippedNames.push(p.name)
                    continue
                  }
                  try {
                    await addProduct({
                      name: p.name,
                      generic_name: p.generic_name || '',
                      category: p.category || 'Medicines',
                      price: parseFloat(p.price) || 0,
                      cost_price: parseFloat(p.cost_price) || 0,
                      stock: parseInt(p.stock) || 0,
                      reorder_level: parseInt(p.reorder_level) || 5,
                      barcode: p.barcode || '',
                      list_on_carefind: p.list_on_carefind !== false,
                      emoji: '💊',
                      business_id: brand.id,
                    })
                    added++
                  } catch (e) { console.error('Error adding product:', p.name, e) }
                }
                await reload()
                if (skipped > 0) {
                  showToast(added + ' added · ' + skipped + ' skipped (already exist): ' + skippedNames.slice(0, 3).join(', ') + (skippedNames.length > 3 ? '...' : ''))
                } else {
                  showToast(added + ' of ' + uploadData.length + ' products imported!')
                }
                setUploadData([])
                setShowUpload(false)
              }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                Import {uploadData.length} Products
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Clean Up Duplicates Modal — review existing duplicates and merge them */}
      <Modal show={showCleanup} onClose={() => setShowCleanup(false)} title='Clean Up Duplicate Products'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', lineHeight: '1.7' }}>
            Found <strong>{duplicateGroups.length}</strong> group(s) of duplicate products already in your inventory — products matching by brand name or generic name. Merging will combine the stock of each group into one product and remove the rest.
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {duplicateGroups.map((group, gi) => {
              const totalStock = group.reduce((s, p) => s + (p.stock || 0), 0)
              return (
                <div key={gi} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #fde68a', background: '#fffdf5' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', marginBottom: '8px' }}>
                    GROUP {gi + 1} — {group.length} duplicates · will combine to {totalStock} units
                  </div>
                  {group.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '6px', background: 'white', marginBottom: '4px', fontSize: '12px' }}>
                      <div>
                        <span style={{ fontWeight: '600' }}>{p.emoji || '📦'} {p.name}</span>
                        {(p.generic_name || p.genericName) && <span style={{ color: '#aaa' }}> · {p.generic_name || p.genericName}</span>}
                      </div>
                      <span style={{ color: '#888', fontWeight: '600' }}>{p.stock} units · {fmt(p.price)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={() => setShowCleanup(false)} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn>
            <button onClick={mergeAllDuplicates} disabled={cleaningUp}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: cleaningUp ? '#e5e7eb' : 'linear-gradient(135deg,#0f766e,#14b8a6)', color: cleaningUp ? '#aaa' : 'white', fontWeight: '800', fontSize: '14px', cursor: cleaningUp ? 'not-allowed' : 'pointer' }}>
              {cleaningUp ? 'Merging...' : 'Merge All ' + duplicateGroups.length + ' Group(s)'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Product Warning */}
      <Modal show={!!duplicateWarning} onClose={() => setDuplicateWarning(null)} title='Product Already Exists'>
        {duplicateWarning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', lineHeight: '1.7' }}>
              ⚠️ A product with this name or generic name is already in your inventory. You can update the existing product instead of creating a duplicate.
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #f0f0f0', background: '#fafafa' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#aaa', marginBottom: '6px' }}>EXISTING IN INVENTORY</div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{duplicateWarning.existing.emoji || '📦'} {duplicateWarning.existing.name}</div>
                {(duplicateWarning.existing.generic_name || duplicateWarning.existing.genericName) && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{duplicateWarning.existing.generic_name || duplicateWarning.existing.genericName}</div>
                )}
                <div style={{ fontSize: '13px', fontWeight: '700', color: TEALC, marginTop: '6px' }}>{fmt(duplicateWarning.existing.price)}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{duplicateWarning.existing.stock} in stock</div>
              </div>
              <div style={{ fontSize: '18px', color: '#ccc' }}>→</div>
              <div style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccfbf1', background: '#f0fdfa' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#0f766e', marginBottom: '6px' }}>YOU'RE ADDING</div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{duplicateWarning.incoming.name}</div>
                {duplicateWarning.incoming.generic_name && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{duplicateWarning.incoming.generic_name}</div>
                )}
                <div style={{ fontSize: '13px', fontWeight: '700', color: TEALC, marginTop: '6px' }}>{fmt(duplicateWarning.incoming.price)}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>+{duplicateWarning.incoming.stock} units</div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f9fafb', fontSize: '12px', color: '#555' }}>
              Updating will combine stock ({duplicateWarning.existing.stock} + {duplicateWarning.incoming.stock} = {(duplicateWarning.existing.stock || 0) + (duplicateWarning.incoming.stock || 0)} units) and apply the new price you entered.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TealBtn onClick={updateExistingFromDuplicate} style={{ width: '100%', padding: '12px' }}>Update Existing Product</TealBtn>
              <button onClick={addNewAnyway}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #0f766e', background: 'white', color: '#0f766e', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                No — add it as a separate product
              </button>
              <GhostBtn onClick={() => setDuplicateWarning(null)} style={{ width: '100%', padding: '12px' }}>Cancel</GhostBtn>
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={toastMsg} />
    </div>
  )
}

function ProductModal({ product, perms, onSave, onClose }) {
  const [form, setForm] = useState(product ? { ...product, cat: product.cat || product.category } : { emoji: '💊', cat: 'Medicines', list_on_carefind: true })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const isEdit = !!product
  const canEditPrice = !isEdit || perms?.canEditPrice

  const save = async () => {
    if (!form.name || !form.price) { alert('Please enter product name and selling price.'); return }
    setSaving(true)
    await onSave({ ...form, price: parseFloat(form.price) || 0, cost_price: parseFloat(form.cost_price) || 0, stock: (form.cat || form.category) === 'Services' ? 999 : parseInt(form.stock) || 0, reorder_level: parseInt(form.reorder_level) || 5, category: form.cat || form.category || 'Medicines' })
    setSaving(false)
  }

  return (
    <Modal show title={isEdit ? 'Edit Product' : 'Add New Product'} onClose={onClose}
      footer={<><GhostBtn onClick={onClose} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={save} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}</TealBtn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '8px' }}>Icon</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {PRODUCT_EMOJIS.map(e => (
              <button key={e} onClick={() => f('emoji', e)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: form.emoji === e ? '2px solid #0f766e' : '1px solid #e5e7eb', background: form.emoji === e ? '#f0fdfa' : '#f9fafb', cursor: 'pointer', fontSize: '16px' }}>{e}</button>
            ))}
          </div>
        </div>
        <Inp label='Product Name *' value={form.name} onChange={v => f('name', v)} placeholder='e.g. Amoxicillin 500mg' required />
        <Inp label='Generic / Common Name' value={form.generic_name} onChange={v => f('generic_name', v)} placeholder='e.g. Amoxicillin' />
        <Sel label='Category' value={form.cat} onChange={v => f('cat', v)} options={PRODUCT_CATS} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Inp label='Selling Price (₦) *' value={form.price} onChange={v => f('price', v)} type='number' placeholder='0' required readOnly={!canEditPrice} />
          <Inp label='Cost Price (₦)' value={form.cost_price} onChange={v => f('cost_price', v)} type='number' placeholder='0' readOnly={!canEditPrice} />
        </div>
        {form.price && form.cost_price && parseFloat(form.price) > 0 && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#f0fdf4', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
            Profit margin: {Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100)}%
          </div>
        )}
        {!canEditPrice && <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#fffbeb', fontSize: '12px', color: '#d97706' }}>⚠️ Only the Owner can edit prices</div>}
        <div>
          <Inp label='Sold per (unit)' value={form.sales_unit} onChange={v => { f('sales_unit', v); f('price_unit', v) }} placeholder='e.g. Carton, Box, Pack, Card, Tablet' />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {['Carton', 'Box', 'Pack', 'Card', 'Tablet', 'Piece', 'Bottle', 'Sachet'].map(u => (
              <button key={u} type='button' onClick={() => { f('sales_unit', u); f('price_unit', u) }}
                style={{ fontSize: '11px', fontWeight: '700', padding: '6px 11px', borderRadius: '20px', cursor: 'pointer',
                  border: form.sales_unit === u ? '1px solid #0f766e' : '1px solid #e5e7eb',
                  background: form.sales_unit === u ? '#0f766e' : 'white',
                  color: form.sales_unit === u ? 'white' : '#666' }}>
                {u}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            The price above is the price for one {form.sales_unit ? form.sales_unit.toLowerCase() : 'unit'}. Leave blank to sell as single units.
          </div>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>How do you sell this?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['retail', 'wholesale', 'distributor', 'importer', 'manufacturer'].map(t => (
              <button key={t} type='button' onClick={() => f('sale_type', form.sale_type === t ? '' : t)}
                style={{ fontSize: '11px', fontWeight: '700', padding: '7px 12px', borderRadius: '20px', cursor: 'pointer', textTransform: 'capitalize',
                  border: form.sale_type === t ? '1px solid #0f766e' : '1px solid #e5e7eb',
                  background: form.sale_type === t ? '#0f766e' : 'white',
                  color: form.sale_type === t ? 'white' : '#666' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Shows as a label on CareFind so buyers know what kind of seller you are. Tap again to clear.
          </div>
        </div>
        <Inp label='Minimum order' value={form.min_purchase} onChange={v => f('min_purchase', v)} type='number'
          placeholder='Leave blank if there is no minimum' />
        {form.cat !== 'Services' && (
          <div>
            <Inp label='Shelf / Storage Location' value={form.shelf} onChange={v => f('shelf', v)} placeholder='e.g. Shelf A3, Rack 12, Cold Room, Aisle 2 Bay 4' />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              Where this product physically sits, so staff can find it fast.
            </div>
          </div>
        )}
        {form.cat !== 'Services' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Stock Quantity' value={form.stock} onChange={v => f('stock', v)} type='number' placeholder='0' readOnly={!perms?.canEditStock} />
            <Inp label='Reorder Level' value={form.reorder_level} onChange={v => f('reorder_level', v)} type='number' placeholder='5' />
          </div>
        )}
        <Inp label='Barcode (optional)' value={form.barcode} onChange={v => f('barcode', v)} placeholder='Scan or type barcode' />
        <Toggle label='List on CareFind' desc='Show this product publicly on CareFind so patients can search for it' value={form.list_on_carefind !== false} onChange={v => f('list_on_carefind', v)} />
      </div>
    </Modal>
  )
}

function RestockModal({ product, onRestock, onClose }) {
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    if (!qty || parseInt(qty) <= 0) { alert('Enter a valid quantity'); return }
    setSaving(true); await onRestock(qty, note); setSaving(false)
  }
  return (
    <Modal show title='Restock Product' onClose={onClose}
      footer={<><GhostBtn onClick={onClose} style={{ flex: 1, padding: '12px' }}>Cancel</GhostBtn><TealBtn onClick={handle} style={{ flex: 1, padding: '12px' }}>{saving ? 'Saving...' : '+ Add Stock'}</TealBtn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ padding: '12px', borderRadius: '10px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#888' }}>Current stock</span><span style={{ fontWeight: '700' }}>{product.stock} units</span>
        </div>
        <Inp label='Units to Add *' value={qty} onChange={setQty} type='number' placeholder='e.g. 100' required />
        {qty && parseInt(qty) > 0 && <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>New total: {product.stock + parseInt(qty)} units</div>}
        <Inp label='Note (optional)' value={note} onChange={setNote} placeholder='Supplier name, invoice number...' />
        {product.list_on_carefind !== false && <div style={{ padding: '10px', borderRadius: '8px', background: '#f0fdfa', fontSize: '12px', color: '#0f766e' }}>🔍 After restocking this product will show as available on CareFind</div>}
      </div>
    </Modal>
  )
}
