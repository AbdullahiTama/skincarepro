import { fmt, businessIcon, businessName } from '../../lib/utils'
import { Card, StatCard, Pill, Toggle } from '../../components/ui'
import { updateProduct } from '../../lib/supabase'

export default function CareFind({ brand, products, setProducts, loadProducts }) {
  const bType = brand?.business_type || brand?.type || 'skincare'
  const listed = products.filter(p => p.list_on_carefind !== false && p.stock > 0)
  const unlisted = products.filter(p => p.list_on_carefind === false)
  const outOfStock = products.filter(p => p.list_on_carefind !== false && p.stock <= 0)
  const waLink = 'https://wa.me/' + ((brand?.whatsapp || '').replace(/[^0-9]/g, '') || '')

  async function toggleCareFind(product) {
    try {
      await updateProduct(product.id, { list_on_carefind: !product.list_on_carefind })
      loadProducts && loadProducts()
    } catch (e) {}
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>CareFind Profile</div>
        <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>How your business appears to patients searching on CareFind</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon='🔍' label='Listed Products' value={listed.length} sub='Visible to patients' />
        <StatCard icon='❌' label='Out of Stock' value={outOfStock.length} alert={outOfStock.length > 0} sub='Hidden from search' />
        <StatCard icon='🙈' label='Hidden' value={unlisted.length} sub='Manually hidden' />
      </div>

      {/* Public profile preview */}
      <Card style={{ marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', color: 'white' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1.5px' }}>CAREFIND PUBLIC VIEW</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#0f766e,#14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
              {businessIcon(bType)}
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '18px' }}>{brand?.name}</div>
              <div style={{ fontSize: '12px', color: '#14b8a6', marginTop: '2px' }}>{businessName(bType)}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{brand?.address || 'Address not set'}{brand?.state ? ', ' + brand.state : ''}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid #f0f0f0' }}>
          {brand?.hours && <span style={{ fontSize: '12px', color: '#555' }}>🕐 {brand.hours}</span>}
          {brand?.whatsapp && <a href={waLink} target='_blank' rel='noreferrer' style={{ fontSize: '12px', color: '#059669', textDecoration: 'none', fontWeight: '700' }}>📱 WhatsApp: {brand.whatsapp}</a>}
          {(brand?.visible_on_carefind !== false) ? <Pill label='Live on CareFind ✓' type='green' /> : <Pill label='Not Listed' type='red' />}
        </div>
        {listed.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>No products listed on CareFind yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '10px', padding: '14px' }}>
            {listed.slice(0, 9).map(p => (
              <div key={p.id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{p.emoji || '📦'}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#111', marginBottom: '2px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f766e' }}>{fmt(p.price)}</div>
                <div style={{ fontSize: '9px', color: '#bbb', marginTop: '2px' }}>{p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Product toggle list */}
      <Card>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: '800', fontSize: '15px' }}>Manage Product Visibility</div>
        {products.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>No products in inventory yet</div>
        ) : products.map(p => {
          const cat = p.cat || p.category
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f9f9f9', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '18px' }}>{p.emoji || '📦'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>{fmt(p.price)} · {cat === 'Services' ? 'Service' : p.stock + ' in stock'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {p.stock <= 0 && cat !== 'Services' && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700' }}>OUT</span>}
                <button onClick={() => toggleCareFind(p)}
                  style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative', background: p.list_on_carefind !== false ? '#0f766e' : '#e5e7eb', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: p.list_on_carefind !== false ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
