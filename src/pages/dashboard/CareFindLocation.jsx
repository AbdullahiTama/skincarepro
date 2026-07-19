import { useState, useEffect } from 'react'
import { getBusinessById, updateBusiness, reverseGeocode } from '../../lib/supabase'
import { Card, Inp, Toggle, TealBtn, GhostBtn } from '../../components/ui'

// Pins the business on the map and controls whether its prices are public.
// Without coordinates a business simply cannot appear in "nearest to me"
// searches, so the warning here is deliberately hard to miss.
export default function CareFindLocation({ brand, showToast }) {
  const [biz, setBiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pinning, setPinning] = useState(false)

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [label, setLabel] = useState('')
  const [showPrice, setShowPrice] = useState(true)

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    if (!brand || !brand.id) return
    setLoading(true)
    try {
      const b = await getBusinessById(brand.id)
      setBiz(b)
      setLat(b?.lat != null ? String(b.lat) : '')
      setLng(b?.lng != null ? String(b.lng) : '')
      setLabel(b?.location_label || '')
      setShowPrice(b?.show_price_on_carefind !== false)
    } catch (e) {
      alert('Could not load your business: ' + e.message)
    }
    setLoading(false)
  }

  const isPinned = lat !== '' && lng !== '' && !isNaN(Number(lat)) && !isNaN(Number(lng))

  function pinHere() {
    if (!navigator.geolocation) {
      alert('This browser cannot read your location. Type the coordinates in manually instead.')
      return
    }
    setPinning(true)
    navigator.geolocation.getCurrentPosition(
      async function (pos) {
        const la = pos.coords.latitude
        const ln = pos.coords.longitude
        setLat(String(la))
        setLng(String(ln))
        try {
          const name = await reverseGeocode(la, ln)
          if (name) setLabel(name)
        } catch (e) {}
        setPinning(false)
        if (showToast) showToast('Location captured — remember to save')
      },
      function (err) {
        setPinning(false)
        alert('Could not get your location: ' + (err.message || 'permission denied') + '. Allow location for this site, or type the coordinates manually.')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  async function save() {
    if (lat !== '' && isNaN(Number(lat))) { alert('Latitude must be a number.'); return }
    if (lng !== '' && isNaN(Number(lng))) { alert('Longitude must be a number.'); return }

    setSaving(true)
    try {
      await updateBusiness(brand.id, {
        lat: lat === '' ? null : Number(lat),
        lng: lng === '' ? null : Number(lng),
        location_label: label || null,
        show_price_on_carefind: showPrice,
      })
      if (showToast) showToast('Saved')
      load()
    } catch (e) {
      alert('Could not save: ' + e.message)
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '24px', color: '#888', fontSize: '13px' }}>Loading…</div>

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Location & CareFind Visibility</div>
        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
          Pin where you are so patients searching nearby can find you.
        </div>
      </div>

      {!isPinned && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '2px solid #dc2626', marginBottom: '18px' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#dc2626', marginBottom: '6px' }}>
            ⚠️ Your business is not on the map yet
          </div>
          <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
            When someone searches CareFind for a medication, results are ranked by how close each
            seller is to them. Until you pin your location, <strong>your products will always appear
            below every business that has</strong> — even ones further away and even when you have
            exactly what the patient is looking for.
            <br /><br />
            It takes one tap. You can skip it, but you will lose customers who are standing
            minutes from your door.
          </div>
        </div>
      )}

      {isPinned && (
        <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1', marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f766e' }}>✓ You are on the map</div>
          <div style={{ fontSize: '12.5px', color: '#0f766e', marginTop: '3px' }}>
            {label || 'Pinned'} — patients searching nearby will see how far away you are.
          </div>
        </div>
      )}

      <Card style={{ padding: '18px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>YOUR LOCATION</div>

        <button type='button' onClick={pinHere} disabled={pinning}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: pinning ? '#94a3b8' : '#0f766e', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginBottom: '14px' }}>
          {pinning ? 'Finding you…' : '📍 Use my current location'}
        </button>

        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.5' }}>
          Stand inside or in front of your premises when you tap this, so the pin lands on the right spot.
        </div>

        <Inp label='Location name' value={label} onChange={setLabel} placeholder='e.g. 12 Herbert Macaulay Way, Yaba, Lagos' />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
          <Inp label='Latitude' value={lat} onChange={setLat} placeholder='6.5244' />
          <Inp label='Longitude' value={lng} onChange={setLng} placeholder='3.3792' />
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
          These fill in automatically when you tap the button above. Only type them by hand if you know the exact coordinates.
        </div>
      </Card>

      <Card style={{ padding: '18px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>PRICING ON CAREFIND</div>
        <Toggle
          label='Show my prices on CareFind'
          desc='When off, your products still appear in search but the price is hidden and patients see "Ask for price" instead.'
          value={showPrice}
          onChange={setShowPrice}
        />
      </Card>

      <div style={{ display: 'flex', gap: '10px' }}>
        <GhostBtn onClick={load} style={{ flex: 1, padding: '13px' }}>Reset</GhostBtn>
        <TealBtn onClick={save} style={{ flex: 2, padding: '13px' }}>{saving ? 'Saving…' : 'Save'}</TealBtn>
      </div>
    </div>
  )
}
