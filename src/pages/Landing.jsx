import { useNavigate } from 'react-router-dom'
import { TEAL, DARK, BUSINESS_TYPES } from '../lib/utils'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Nav */}
      <nav style={{ backgroundImage: DARK, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏥</div>
          <span style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>CareHub</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => navigate('/register')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: TEAL, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ backgroundImage: DARK, color: 'white', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(20,184,166,0.15)', color: '#14b8a6', fontSize: '13px', fontWeight: '700', marginBottom: '20px', border: '1px solid rgba(20,184,166,0.3)' }}>
          Built for Nigerian Healthcare Businesses
        </div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: '900', lineHeight: '1.2', margin: '0 0 16px' }}>
          One Platform.<br /><span style={{ color: '#14b8a6' }}>Every Healthcare Business.</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '540px', margin: '0 auto 32px', lineHeight: '1.7' }}>
          CareHub gives pharmacies, clinics, spas, dental practices, and wellness centers everything they need — plus gets them discovered by patients searching nearby.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} style={{ padding: '14px 28px', borderRadius: '14px', border: 'none', background: TEAL, color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>Start Free Today →</button>
          <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>Sign In</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
          {BUSINESS_TYPES.map(b => (
            <span key={b.id} style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '900', marginBottom: '40px', color: '#0f172a' }}>Everything your healthcare business needs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
          {[['🛒', 'Smart POS', 'Cash, transfer, POS machine, split payment, sales on credit, sales on hold'], ['📦', 'Inventory', 'Track stock, cost price, profit margins, upload via Excel, barcode scanning'], ['📋', 'Consultations', 'Tailored forms for each business type — pharmacy, hospital, skincare and more'], ['🏥', 'Hospital Workflow', 'Reception → Triage → Doctor → Pharmacy — real-time patient tracking'], ['📊', 'Financial Reports', 'Revenue, expenses, profit breakdown, export to Excel'], ['🔍', 'CareFind', 'Get discovered by patients searching for healthcare near them'], ['👥', 'Staff & Roles', 'Role-based access — each staff only sees what they need'], ['📴', 'Works Offline', 'Sell without internet, sync when back online'], ['🏢', 'Multi-Location', 'One login, multiple branches, compare performance']].map(([icon, title, desc]) => (
            <div key={title} style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>{title}</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.6' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f0fdfa', padding: '60px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: '#0f172a' }}>Simple, affordable pricing</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '40px' }}>Pay 10 months, get 12. All plans include CareFind listing.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
          {[['🌱', 'Basic', '₦10,000', '/month', 'Single location · Up to 5 staff · All features', false], ['🚀', 'Growth', '₦25,000', '/month', 'Up to 5 branches · Unlimited staff · Cross-branch reports', true], ['🏥', 'Hospital', '₦35,000', '/month', 'Full hospital workflow · Lab · Imaging · E-prescriptions', false], ['💎', 'Hospital Enterprise', '₦60,000', '/month', 'Unlimited locations · Large hospitals · Priority support', false]].map(([icon, name, price, period, desc, popular]) => (
            <div key={name} style={{ background: popular ? '#0f172a' : 'white', padding: '24px', borderRadius: '16px', border: popular ? 'none' : '1px solid #f0f0f0', position: 'relative', boxShadow: popular ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              {popular && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: TEAL, color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px' }}>MOST POPULAR</div>}
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: popular ? 'white' : '#0f172a', marginBottom: '8px' }}>{name}</div>
              <div style={{ marginBottom: '12px' }}><span style={{ fontSize: '28px', fontWeight: '900', color: popular ? '#14b8a6' : '#0f766e' }}>{price}</span><span style={{ fontSize: '12px', color: popular ? 'rgba(255,255,255,0.5)' : '#888' }}>{period}</span></div>
              <div style={{ fontSize: '12px', color: popular ? 'rgba(255,255,255,0.6)' : '#888', lineHeight: '1.7', marginBottom: '16px' }}>{desc}</div>
              <button onClick={() => navigate('/register')} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: popular ? TEAL : '#f0fdfa', color: popular ? 'white' : '#0f766e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Get Started</button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '60px 24px', textAlign: 'center', backgroundImage: DARK, color: 'white' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '12px' }}>Ready to grow your healthcare business?</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>Join healthcare businesses across Nigeria using CareHub</p>
        <button onClick={() => navigate('/register')} style={{ padding: '16px 36px', borderRadius: '14px', border: 'none', background: TEAL, color: 'white', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>Register Your Business Free →</button>
      </div>

      <div style={{ background: '#0f172a', color: 'rgba(255,255,255,0.3)', padding: '20px', textAlign: 'center', fontSize: '12px' }}>
        © 2025 CareHub · Built for Nigerian Healthcare · support@carehub.ng
      </div>
    </div>
  )
}
