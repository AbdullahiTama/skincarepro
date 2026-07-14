import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/supabase'
import { watchTable } from '../../lib/realtime'

function timeAgo(d) {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  return Math.floor(diff / 86400) + 'd ago'
}

function readAuth() {
  try { return JSON.parse(localStorage.getItem('carehub_auth') || '{}') } catch (e) { return {} }
}

export default function NotificationBell({ brand }) {
  const navigate = useNavigate()
  const authData = readAuth()
  const meStaffId = (authData && authData.staff && authData.staff.id) ? authData.staff.id : null

  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(function () { load() }, [brand?.id])

  // New notifications land without a refresh.
  useEffect(function () {
    if (!brand || !brand.id) return
    const stop = watchTable('staff_notifications', brand.id, function (row) {
      const mine = meStaffId ? row.staff_id === meStaffId : row.is_owner === true
      if (!mine) return
      setItems(function (prev) {
        if (prev.some(function (n) { return n.id === row.id })) return prev
        return [row].concat(prev)
      })
    })
    return function () { stop() }
  }, [brand?.id])

  async function load() {
    if (!brand || !brand.id) return
    try {
      const rows = await getMyNotifications(brand.id, meStaffId)
      setItems(rows || [])
    } catch (e) {
      // Silent — a failed notification fetch must not break the dashboard.
    }
  }

  const unread = items.filter(function (n) { return !n.read_at })

  async function openItem(n) {
    try {
      if (!n.read_at) {
        await markNotificationRead(n.id)
        setItems(function (prev) {
          return prev.map(function (x) {
            if (x.id !== n.id) return x
            const copy = { ...x }
            copy.read_at = new Date().toISOString()
            return copy
          })
        })
      }
    } catch (e) {}
    setOpen(false)
    if (n.link) navigate('/dashboard/' + n.link)
  }

  async function clearAll() {
    try {
      await markAllNotificationsRead(brand.id, meStaffId)
      setItems(function (prev) {
        const stamp = new Date().toISOString()
        return prev.map(function (x) {
          const copy = { ...x }
          if (!copy.read_at) copy.read_at = stamp
          return copy
        })
      })
    } catch (e) {
      alert('Could not mark all as read: ' + e.message)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={function () { setOpen(!open) }}
        style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', textAlign: 'left',
          background: unread.length > 0 ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
          color: unread.length > 0 ? '#f87171' : 'rgba(255,255,255,0.55)' }}>
        <span style={{ fontSize: '15px' }}>🔔</span>
        Notifications
        {unread.length > 0 && (
          <span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: '900', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={function () { setOpen(false) }}>
          <div onClick={function (e) { e.stopPropagation() }}
            style={{ position: 'absolute', top: '0', left: '0', bottom: '0', width: '340px', maxWidth: '90vw', background: 'white', boxShadow: '4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Notifications</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                  {unread.length > 0 ? unread.length + ' unread' : 'All caught up'}
                </div>
              </div>
              <button onClick={function () { setOpen(false) }}
                style={{ flexShrink: 0, background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 11px', fontSize: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                Close
              </button>
            </div>

            {unread.length > 0 && (
              <button onClick={clearAll}
                style={{ padding: '10px 18px', background: '#f8fafc', border: 'none', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#0f766e', cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {items.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Nothing yet</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    You will be told here when an order needs you, or someone sends you correspondence.
                  </div>
                </div>
              )}

              {items.map(function (n) {
                const isNew = !n.read_at
                return (
                  <button key={n.id} onClick={function () { openItem(n) }}
                    style={{ width: '100%', textAlign: 'left', padding: '14px 18px', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                      background: isNew ? '#f0fdfa' : 'white',
                      borderLeft: isNew ? '3px solid #0f766e' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isNew ? '800' : '600', color: '#0f172a' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: '1.45' }}>
                        {n.body}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
