import { useState, useEffect } from 'react'
import { TEAL, TEALC, DARK } from '../../lib/utils'

// ── PILL ─────────────────────────────────────────────────────────────────────
export function Pill({ label, type = 'gray' }) {
  const map = {
    gray:   { bg: '#f3f4f6', color: '#666' },
    green:  { bg: '#f0fdf4', color: '#059669' },
    amber:  { bg: '#fffbeb', color: '#d97706' },
    red:    { bg: '#fef2f2', color: '#dc2626' },
    blue:   { bg: '#eff6ff', color: '#2563eb' },
    purple: { bg: '#f5f3ff', color: '#7c3aed' },
    teal:   { bg: '#f0fdfa', color: '#0f766e' },
  }
  const s = map[type] || map.gray
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>
      {label}
    </span>
  )
}

// ── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'white', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, alert, onClick }) {
  return (
    <Card onClick={onClick} style={{ padding: '18px', border: alert ? '1px solid #fcd34d' : '1px solid #f0f0f0', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: '#111' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{sub}</div>}
    </Card>
  )
}

// ── BUTTONS ──────────────────────────────────────────────────────────────────
export function TealBtn({ children, onClick, style = {}, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: disabled ? '#e5e7eb' : TEAL, color: disabled ? '#bbb' : 'white', fontWeight: '700', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {children}
    </button>
  )
}
export function DarkBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: DARK, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', ...style }}>
      {children}
    </button>
  )
}
export function GhostBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 13px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#555', fontWeight: '600', fontSize: '12px', cursor: 'pointer', ...style }}>
      {children}
    </button>
  )
}
export function RedBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 13px', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer', ...style }}>
      {children}
    </button>
  )
}

// ── SECTION HEAD ─────────────────────────────────────────────────────────────
export function SectionHead({ title, sub, btn, onBtn }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
      <div>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#111' }}>{title}</div>
        {sub && <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>{sub}</div>}
      </div>
      {btn && <TealBtn onClick={onBtn}>{btn}</TealBtn>}
    </div>
  )
}

// ── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 32, bg = TEAL }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: 'white', fontWeight: '900', fontSize: size * 0.38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// ── TOAST ────────────────────────────────────────────────────────────────────
export function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '14px', background: TEAL, color: 'white', fontWeight: '700', fontSize: '13px', boxShadow: '0 4px 16px rgba(15,118,110,0.4)' }}>
      {msg}
    </div>
  )
}

// ── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ show, onClose, title, children, footer, wide }) {
  if (!show) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <Card style={{ width: '100%', maxWidth: wide ? '700px' : '500px', overflow: 'hidden', margin: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '16px' }}>{title}</div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', maxHeight: '65vh', overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ padding: '14px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>{footer}</div>}
      </Card>
    </div>
  )
}

// ── FORM INPUTS ──────────────────────────────────────────────────────────────
export function Inp({ label, value, onChange, type = 'text', placeholder = '', required, style = {}, readOnly, min }) {
  return (
    <div style={style}>
      {label && <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</div>}
      <input type={type} value={value || ''} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} min={min}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: readOnly ? '#f9fafb' : 'white' }} />
    </div>
  )
}

export function Sel({ label, value, onChange, options = [], required, style = {} }) {
  return (
    <div style={style}>
      {label && <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</div>}
      <select value={value || ''} onChange={e => onChange && onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
        <option value=''>Select...</option>
        {options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Textarea({ label, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <div>
      {label && <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>{label}</div>}
      <textarea value={value || ''} onChange={e => onChange && onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
    </div>
  )
}

export function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{label}</div>
        {desc && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', background: value ? TEALC : '#e5e7eb', flexShrink: 0, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

// ── OFFLINE BANNER ───────────────────────────────────────────────────────────
export function OfflineBanner({ businessId, onSync }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const { getOfflineQueue } = require('../lib/supabase')
    setPending(getOfflineQueue().length)
    const up = () => { setOnline(true); setPending(getOfflineQueue().length) }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  if (online && pending === 0) return null

  return (
    <div style={{ padding: '10px 20px', background: online ? '#059669' : '#dc2626', color: 'white', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span>{online ? pending + ' offline sale(s) ready to sync' : 'No internet — Offline mode active. Sales will sync when connected.'}</span>
      {online && pending > 0 && (
        <button onClick={onSync} style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', background: 'white', color: '#059669', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>
          Sync Now
        </button>
      )}
    </div>
  )
}

// ── LOADING SPINNER ──────────────────────────────────────────────────────────
export function Loading({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#aaa' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      <div style={{ fontSize: '14px' }}>{text}</div>
    </div>
  )
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', message, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#ccc', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <div style={{ fontSize: '15px', color: '#888', marginBottom: action ? '20px' : '0' }}>{message}</div>
      {action && <TealBtn onClick={onAction}>{action}</TealBtn>}
    </div>
  )
}

// ── USE TOAST HOOK ────────────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState('')
  const show = (message, duration = 3000) => {
    setMsg(message)
    setTimeout(() => setMsg(''), duration)
  }
  return { msg, show }
}
