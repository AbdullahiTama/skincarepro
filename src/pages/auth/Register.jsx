import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerBusiness } from '../../lib/supabase.js'
import { Card, Inp, Sel, TealBtn, DarkBtn, GhostBtn, Toggle } from '../../components/ui/index.jsx'
import { TEAL, DARK, BUSINESS_TYPES, NIG_STATES, businessIcon, businessName } from '../../lib/utils.js'

export default function Register() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const STEPS = ['Business Info', 'Contact & Location', 'Owner Info', 'Account', 'Review']
  const f = (k, v) => setData(p => ({ ...p, [k]: v }))

  const canNext = () => {
    if (step === 1) return data.businessName && data.state && data.address && data.phone && data.businessEmail
    if (step === 2) return data.whatsapp && data.businessHours
    if (step === 3) return data.firstName && data.lastName && data.ownerEmail && data.ownerPhone
    if (step === 4) return data.password && data.password === data.confirmPassword && data.password.length >= 6 && data.agreedTerms
    return true
  }

  const submit = async () => {
    setSaving(true)
    try {
      await registerBusiness({
        name: data.businessName,
        owner: (data.firstName + ' ' + data.lastName).trim(),
        email: data.ownerEmail,
        password: data.password,
        phone: data.ownerPhone || '',
        whatsapp: data.whatsapp || '',
        address: data.address || '',
        state: data.state || '',
        city: data.city || '',
        business_type: data.businessType || 'skincare',
        hours: data.businessHours || '',
        maps_link: data.mapsLink || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        website: data.website || '',
        status: 'pending',
        visible_on_carefind: data.visibleOnCareFind !== false,
        plan: 'basic',
      })
      setDone(true)
    } catch (e) {
      alert('Registration failed. This email may already be registered.')
    }
    setSaving(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '20px' }}>
      <Card style={{ maxWidth: '440px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>⏳</div>
        <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Registration Submitted!</div>
        <div style={{ fontSize: '14px', color: '#888', lineHeight: '1.8', marginBottom: '24px' }}>
          Thank you <strong>{data.firstName}</strong>! Your business <strong>{data.businessName}</strong> has been submitted for review. You will be notified within 24 hours.
        </div>
        <div style={{ background: '#f0fdfa', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
          {[['done', 'Registration submitted'], ['pending', 'Admin review in progress'], ['wait', 'Approval notification sent to your email'], ['wait2', 'Dashboard unlocked — start using CareHub']].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px', color: k === 'done' ? '#059669' : k === 'pending' ? '#d97706' : '#bbb' }}>
              <span>{k === 'done' ? '✅' : k === 'pending' ? '⏳' : '⬜'}</span><span>{l}
            </span></div>
          ))}
        </div>
        <DarkBtn onClick={() => navigate('/login')} style={{ width: '100%', padding: '13px' }}>Go to Login</DarkBtn>
      </Card>
    </div>
  )

  // Step 0 — type selection
  if (step === 0) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Link to='/login' style={{ color: '#888', fontSize: '13px', textDecoration: 'none', marginBottom: '24px', display: 'block' }}>← Back</Link>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px' }}>🏥</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>What type of business are you?</div>
          <div style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>Your consultation forms and features will be tailored to your selection</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px' }}>
          {BUSINESS_TYPES.map(b => (
            <button key={b.id} onClick={() => { f('businessType', b.id); setStep(1) }}
              style={{ padding: '20px', borderRadius: '16px', border: '2px solid #f0f0f0', background: 'white', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{b.icon}</div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>{b.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 20px' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setStep(s => s - 1)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <div>
            <div style={{ fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>Register {businessIcon(data.businessType)} {businessName(data.businessType)}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Step {step} of {STEPS.length} — {STEPS[step - 1]}</div>
          </div>
        </div>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ height: '100%', width: ((step / STEPS.length) * 100) + '%', background: TEAL, borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>

        <Card style={{ padding: '24px', marginBottom: '16px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Business Information</div>
              <Inp label='Business Name' value={data.businessName} onChange={v => f('businessName', v)} placeholder='e.g. HealthPlus Pharmacy Ikeja' required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Sel label='State' value={data.state} onChange={v => f('state', v)} options={NIG_STATES} />
                <Inp label='City / Area' value={data.city} onChange={v => f('city', v)} placeholder='e.g. Ikeja' />
              </div>
              <Inp label='Full Business Address' value={data.address} onChange={v => f('address', v)} placeholder='Street, area, city' required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Inp label='Business Phone' value={data.phone} onChange={v => f('phone', v)} placeholder='08012345678' required />
                <Inp label='Business Email' value={data.businessEmail} onChange={v => f('businessEmail', v)} type='email' placeholder='info@yourbiz.ng' required />
              </div>
              <Inp label='Website or Instagram (optional)' value={data.website} onChange={v => f('website', v)} placeholder='@yourbusiness' />
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Contact & Location for CareFind</div>
              <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '12px', color: '#0f766e', lineHeight: '1.6' }}>
                🔍 This info will show on CareFind so patients can find and contact your business
              </div>
              <Inp label='WhatsApp Number' value={data.whatsapp} onChange={v => f('whatsapp', v)} placeholder='e.g. 08012345678' required />
              <Inp label='Business Hours' value={data.businessHours} onChange={v => f('businessHours', v)} placeholder='e.g. Mon-Sat 8am-8pm' required />
              <Inp label='Google Maps Link (optional)' value={data.mapsLink} onChange={v => f('mapsLink', v)} placeholder='Paste Google Maps URL' />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Inp label='GPS Latitude (optional)' value={data.lat} onChange={v => f('lat', v)} placeholder='e.g. 6.4474' />
                <Inp label='GPS Longitude (optional)' value={data.lng} onChange={v => f('lng', v)} placeholder='e.g. 3.4359' />
              </div>
              <Toggle label='List my business on CareFind' desc='Patients can find your business and products through CareFind' value={data.visibleOnCareFind !== false} onChange={v => f('visibleOnCareFind', v)} />
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Owner / Administrator</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Inp label='First Name' value={data.firstName} onChange={v => f('firstName', v)} placeholder='e.g. Chidinma' required />
                <Inp label='Last Name' value={data.lastName} onChange={v => f('lastName', v)} placeholder='e.g. Eze' required />
              </div>
              <Inp label='Your Email (used to log in)' value={data.ownerEmail} onChange={v => f('ownerEmail', v)} type='email' placeholder='chidinma@gmail.com' required />
              <Inp label='Your Phone' value={data.ownerPhone} onChange={v => f('ownerPhone', v)} placeholder='08099887766' required />
              <Sel label='Years in Business' value={data.yearsInBusiness} onChange={v => f('yearsInBusiness', v)} options={['Less than 1 year', '1-2 years', '3-5 years', 'More than 5 years']} />
              <Sel label='Number of Staff' value={data.staffCount} onChange={v => f('staffCount', v)} options={['Just me (solo)', '2-5 staff', '6-10 staff', 'More than 10']} />
            </div>
          )}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Create Your Password</div>
              <div style={{ padding: '12px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                <div style={{ fontSize: '11px', color: '#888' }}>Login email:</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{data.ownerEmail || '—'}</div>
              </div>
              <Inp label='Password' value={data.password} onChange={v => f('password', v)} type='password' placeholder='Create a strong password' required />
              <Inp label='Confirm Password' value={data.confirmPassword} onChange={v => f('confirmPassword', v)} type='password' placeholder='Repeat your password' required />
              {data.password && data.confirmPassword && (
                <div style={{ fontSize: '12px', fontWeight: '700', color: data.password === data.confirmPassword ? '#059669' : '#ef4444' }}>
                  {data.password === data.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </div>
              )}
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: '800', color: '#0f172a' }}>CareHub Full Access</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>All features + CareFind listing</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '20px', fontWeight: '900', color: '#0f766e' }}>Free</div><div style={{ fontSize: '11px', color: '#bbb' }}>for now</div></div>
              </div>
              <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                <input type='checkbox' checked={data.agreedTerms || false} onChange={e => f('agreedTerms', e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#555', lineHeight: '1.6' }}>I agree to the Terms of Service and Privacy Policy. I understand my account requires admin approval.</span>
              </label>
            </div>
          )}
          {step === 5 && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Review & Submit</div>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                {[
                  ['Business Type', businessIcon(data.businessType) + ' ' + businessName(data.businessType)],
                  ['Business Name', data.businessName],
                  ['State', data.state],
                  ['WhatsApp', data.whatsapp],
                  ['Business Hours', data.businessHours],
                  ['Owner', (data.firstName || '') + ' ' + (data.lastName || '')],
                  ['Login Email', data.ownerEmail],
                  ['CareFind', data.visibleOnCareFind !== false ? 'Yes - Listed publicly' : 'No'],
                ].filter(([, v]) => v).map(([l, v], i) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: i % 2 === 0 ? '#fafafa' : 'white', fontSize: '13px' }}>
                    <span style={{ color: '#888', fontWeight: '600' }}>{l}</span><span style={{ color: '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', lineHeight: '1.7' }}>
                After submitting, admin will review and approve your account within 24 hours.
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 1 && <GhostBtn onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '13px' }}>← Back</GhostBtn>}
          {step < 5
            ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: canNext() ? TEAL : '#e5e7eb', color: canNext() ? 'white' : '#bbb', fontWeight: '800', fontSize: '14px', cursor: canNext() ? 'pointer' : 'not-allowed' }}>
                Continue →
              </button>
            : <button onClick={submit} disabled={saving}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: saving ? '#e5e7eb' : DARK, color: saving ? '#bbb' : 'white', fontWeight: '800', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Submitting...' : 'Submit Registration →'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
