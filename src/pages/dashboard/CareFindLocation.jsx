import { useState, useEffect } from 'react'
import { getBusinessById, updateBusiness, reverseGeocode } from '../../lib/supabase'
import { Card, Inp, Textarea, Toggle, TealBtn, GhostBtn } from '../../components/ui'

const SB_URL = 'https://szdybxmgmhndoytqanfb.supabase.co'
const SB_KEY = 'sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz'

// Shrinks a picture in the browser before it is uploaded. A phone photo can be
// 5MB; this gets it under a few hundred KB so it uploads fast on mobile data
// and loads fast for whoever is browsing CareFind.
function resizeImage(file, maxSize) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader()
    reader.onerror = function () { reject(new Error('Could not read that image.')) }
    reader.onload = function () {
      const img = new Image()
      img.onerror = function () { reject(new Error('That file is not a valid image.')) }
      img.onload = function () {
        let w = img.width
        let h = img.height
        if (w > h && w > maxSize) { h = Math.round(h * (maxSize / w)); w = maxSize }
        else if (h >= w && h > maxSize) { w = Math.round(w * (maxSize / h)); h = maxSize }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Could not process that image.')); return }
          resolve(blob)
        }, 'image/jpeg', 0.85)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

async function uploadBranding(blob, prefix) {
  const path = prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000) + '.jpg'
  const res = await fetch(SB_URL + '/storage/v1/object/business-branding/' + encodeURIComponent(path), {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'image/jpeg',
    },
    body: blob,
  })
  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try { detail = JSON.parse(text).message || text } catch (e) {}
    throw new Error('Upload failed (' + res.status + '): ' + detail)
  }
  return SB_URL + '/storage/v1/object/public/business-branding/' + encodeURIComponent(path)
}

// Everything that shapes how this business looks and ranks on CareFind:
// branding, description, map pin, and whether prices are public.
export default function CareFindLocation({ brand, showToast }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pinning, setPinning] = useState(false)
  const [uploading, setUploading] = useState('')

  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [description, setDescription] = useState('')
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
      setLogoUrl(b?.logo_url || '')
      setCoverUrl(b?.cover_url || '')
      setDescription(b?.description || '')
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

  async function pickImage(e, kind) {
    const file = (e.target.files || [])[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\//.test(file.type)) { alert('Please choose an image file.'); return }

    setUploading(kind)
    try {
      const blob = await resizeImage(file, kind === 'logo' ? 400 : 1400)
      const url = await uploadBranding(blob, kind)
      if (kind === 'logo') setLogoUrl(url)
      else setCoverUrl(url)
      if (showToast) showToast(kind === 'logo' ? 'Logo ready — remember to save' : 'Cover ready — remember to save')
    } catch (err) {
      alert('Could not upload: ' + err.message)
    }
    setUploading('')
  }

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
        logo_url: logoUrl || null,
        cover_url: coverUrl || null,
        description: description || null,
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
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>CareFind Profile</div>
        <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
          How your business looks to patients — and how easily they find you.
        </div>
      </div>

      {/* Live preview so they can see what patients will see */}
      <Card style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '120px', background: coverUrl ? 'url(' + coverUrl + ') center/cover' : 'linear-gradient(135deg, #0f766e, #14b8a6)' }} />
        <div style={{ padding: '0 16px 16px', marginTop: '-32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', border: '3px solid white', background: logoUrl ? 'url(' + logoUrl + ') center/cover' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '900' }}>
            {!logoUrl && (brand?.name ? brand.name[0].toUpperCase() : '🏥')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>{brand?.name || 'Your business'}</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' }}>
            {description || 'Add a short description so patients know what you do.'}
          </div>
        </div>
      </Card>

      {!isPinned && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fef2f2', border: '2px solid #dc2626', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#dc2626', marginBottom: '6px' }}>
            ⚠️ Your business is not on the map yet
          </div>
          <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
            When someone searches CareFind for a medication, results are ranked by how close each
            seller is to them. Until you pin your location, <strong>your products will always appear
            below every business that has</strong> — even ones further away, even when you have exactly
            what the patient wants.
            <br /><br />
            It takes one tap. You can skip it, but you will lose customers standing minutes from your door.
          </div>
        </div>
      )}

      <Card style={{ padding: '18px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '12px' }}>BRANDING</div>

        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Logo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0, background: logoUrl ? 'url(' + logoUrl + ') center/cover' : '#f1f5f9', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#94a3b8' }}>
            {!logoUrl && '🏥'}
          </div>
          <label style={{ flex: 1, display: 'block', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', fontSize: '12.5px', fontWeight: '700', color: '#0f766e' }}>
            {uploading === 'logo' ? 'Uploading…' : logoUrl ? 'Change logo' : '+ Upload logo'}
            <input type='file' accept='image/*' onChange={(e) => pickImage(e, 'logo')} style={{ display: 'none' }} />
          </label>
          {logoUrl && (
            <button type='button' onClick={() => setLogoUrl('')}
              style={{ flexShrink: 0, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '8px 10px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>

        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Cover image</div>
        <div style={{ height: '90px', borderRadius: '12px', marginBottom: '8px', background: coverUrl ? 'url(' + coverUrl + ') center/cover' : '#f1f5f9', border: '1px solid #e5e7eb' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ flex: 1, display: 'block', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', fontSize: '12.5px', fontWeight: '700', color: '#0f766e' }}>
            {uploading === 'cover' ? 'Uploading…' : coverUrl ? 'Change cover' : '+ Upload cover'}
            <input type='file' accept='image/*' onChange={(e) => pickImage(e, 'cover')} style={{ display: 'none' }} />
          </label>
          {coverUrl && (
            <button type='button' onClick={() => setCoverUrl('')}
              style={{ flexShrink: 0, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '8px 12px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
              Remove
            </button>
          )}
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
          A wide photo works best for the cover — your shopfront, premises or team.
        </div>

        <div style={{ marginTop: '16px' }}>
          <Textarea label='About your business' value={description} onChange={setDescription} rows={4}
            placeholder='e.g. Community pharmacy in Yaba since 2015. Prescription dispensing, BP checks, and free delivery within 3km.' />
        </div>
      </Card>

      <Card style={{ padding: '18px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>YOUR LOCATION</div>

        {isPinned && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1', marginBottom: '12px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f766e' }}>✓ You are on the map</div>
            <div style={{ fontSize: '12px', color: '#0f766e', marginTop: '2px' }}>{label || 'Pinned'}</div>
          </div>
        )}

        <button type='button' onClick={pinHere} disabled={pinning}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: pinning ? '#94a3b8' : '#0f766e', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginBottom: '12px' }}>
          {pinning ? 'Finding you…' : isPinned ? '📍 Update my location' : '📍 Use my current location'}
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
          These fill in automatically when you tap the button. Only type them by hand if you know the exact coordinates.
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

      <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '14px' }}>
        You can come back and change any of this at any time.
      </div>
    </div>
  )
}
