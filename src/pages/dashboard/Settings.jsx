import { useState, useEffect } from 'react'
import { getSettings, saveSettings, updateBusiness } from '../../lib/supabase'
import { businessIcon, businessName, NIG_STATES } from '../../lib/utils'
import { Card, SectionHead, Inp, Sel, Textarea, Toggle, TealBtn, GhostBtn, useToast, Toast } from '../../components/ui'

export default function Settings({ brand, role, perms }) {
  const [settings, setSettings] = useState({})
  const [bizForm, setBizForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingBiz, setSavingBiz] = useState(false)
  const { msg, show: showToast } = useToast()
  const isOwner = role === 'Owner'
  const bType = brand?.business_type || brand?.type || 'skincare'

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    setLoading(false)
    try {
      const s = await getSettings(brand.id)
      setSettings(s || {})
      setBizForm({
        name: brand.name || '',
        phone: brand.phone || '',
        whatsapp: brand.whatsapp || '',
        address: brand.address || '',
        state: brand.state || '',
        city: brand.city || '',
        hours: brand.hours || '',
        website: brand.website || '',
        visible_on_carefind: brand.visible_on_carefind !== false,
      })
    } catch (e) {}
    setLoading(false)
  }

  async function saveReceiptSettings() {
    if (!isOwner) { showToast('Only the Owner can change settings'); return }
    setSavingSettings(true)
    try {
      await saveSettings(brand.id, {
        logo_url: settings.logo_url || '',
        receipt_header: settings.receipt_header || '',
        receipt_footer: settings.receipt_footer || '',
        refund_policy: settings.refund_policy || '',
        currency: settings.currency || 'NGN',
        tax_rate: parseFloat(settings.tax_rate) || 0,
      })
      showToast('Settings saved!')
    } catch (e) { showToast('Error saving settings') }
    setSavingSettings(false)
  }

  async function saveBizDetails() {
    if (!isOwner) { showToast('Only the Owner can update business details'); return }
    setSavingBiz(true)
    try {
      await updateBusiness(brand.id, bizForm)
      showToast('Business details updated!')
    } catch (e) { showToast('Error updating details') }
    setSavingBiz(false)
  }

  const s = (k, v) => setSettings(p => ({ ...p, [k]: v }))
  const b = (k, v) => setBizForm(p => ({ ...p, [k]: v }))

  if (!isOwner) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: '#555' }}>Settings are restricted to the business Owner</div>
      <div style={{ fontSize: '13px', marginTop: '8px' }}>Contact the owner to make changes</div>
    </div>
  )

  return (
    <div>
      <SectionHead title='Settings' sub='Business details and receipt customization' />

      {/* Business Type Badge */}
      <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '14px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '32px' }}>{businessIcon(bType)}</div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{businessName(bType)}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Business type — determines your consultation forms and workflow</div>
        </div>
      </div>

      {/* Business Details */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Business Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Inp label='Business Name' value={bizForm.name} onChange={v => b('name', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Inp label='Phone' value={bizForm.phone} onChange={v => b('phone', v)} placeholder='08012345678' />
            <Inp label='WhatsApp' value={bizForm.whatsapp} onChange={v => b('whatsapp', v)} placeholder='08012345678' />
          </div>
          <Inp label='Full Address' value={bizForm.address} onChange={v => b('address', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Sel label='State' value={bizForm.state} onChange={v => b('state', v)} options={NIG_STATES} />
            <Inp label='City / Area' value={bizForm.city} onChange={v => b('city', v)} />
          </div>
          <Inp label='Business Hours' value={bizForm.hours} onChange={v => b('hours', v)} placeholder='e.g. Mon-Sat 8am-8pm' />
          <Inp label='Website / Instagram' value={bizForm.website} onChange={v => b('website', v)} placeholder='@yourbusiness' />
          <Toggle label='Listed on CareFind' desc='Allow patients to find your business on the public CareFind platform' value={bizForm.visible_on_carefind !== false} onChange={v => b('visible_on_carefind', v)} />
          <TealBtn onClick={saveBizDetails} style={{ alignSelf: 'flex-start', padding: '11px 24px' }}>{savingBiz ? 'Saving...' : 'Save Business Details'}</TealBtn>
        </div>
      </Card>

      {/* Receipt Customization */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>Receipt Customization</div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>This appears on every printed receipt</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Inp label='Logo URL' value={settings.logo_url} onChange={v => s('logo_url', v)} placeholder='https://yourwebsite.com/logo.png (paste image URL)' />
          {settings.logo_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: '#f9fafb' }}>
              <img src={settings.logo_url} alt='Logo preview' style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ fontSize: '12px', color: '#888' }}>Logo preview — this is how it appears on receipts</div>
            </div>
          )}
          <Textarea label='Receipt Header' value={settings.receipt_header} onChange={v => s('receipt_header', v)} placeholder='e.g. NAFDAC Reg No: A1-234 | PCN Reg No: PCN/LIC/123' rows={2} />
          <Textarea label='Refund / Return Policy' value={settings.refund_policy} onChange={v => s('refund_policy', v)} placeholder='e.g. No refund on dispensed medicines. Report issues within 24 hours.' rows={3} />
          <Textarea label='Receipt Footer Message' value={settings.receipt_footer} onChange={v => s('receipt_footer', v)} placeholder='e.g. Thank you for choosing us! Your health is our priority.' rows={2} />
          <Inp label='Tax Rate (%)' value={settings.tax_rate} onChange={v => s('tax_rate', v)} type='number' placeholder='0 (leave blank if no tax)' />
        </div>

        {/* Preview */}
        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', border: '2px dashed #e5e7eb', background: '#fafafa' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', marginBottom: '10px', letterSpacing: '1px' }}>RECEIPT PREVIEW</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {settings.logo_url && <img src={settings.logo_url} alt='' style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 6px' }} onError={e => e.target.style.display = 'none'} />}
              <div style={{ fontWeight: '700' }}>{brand?.name || 'Your Business Name'}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>{brand?.address || 'Business Address'}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>WhatsApp: {brand?.whatsapp || '—'}</div>
              {settings.receipt_header && <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px' }}>{settings.receipt_header}</div>}
            </div>
            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
            <div>Amoxicillin 500mg · 2 × ₦1,500 · ₦3,000</div>
            <div>Paracetamol 500mg · 1 × ₦800 · ₦800</div>
            <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
            <div style={{ fontWeight: '700' }}>TOTAL: ₦3,800</div>
            {settings.refund_policy && <div style={{ fontSize: '10px', color: '#888', marginTop: '6px', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>{settings.refund_policy}</div>}
            {settings.receipt_footer && <div style={{ fontSize: '10px', textAlign: 'center', marginTop: '6px', color: '#555' }}>{settings.receipt_footer}</div>}
          </div>
        </div>

        <TealBtn onClick={saveReceiptSettings} style={{ marginTop: '16px', alignSelf: 'flex-start', padding: '11px 24px' }}>{savingSettings ? 'Saving...' : 'Save Receipt Settings'}</TealBtn>
      </Card>

      <Toast msg={msg} />
    </div>
  )
}
