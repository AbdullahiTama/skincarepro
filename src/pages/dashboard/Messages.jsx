import { useState, useEffect } from 'react'
import { getMessageThreads, getThreadMessages, getMessageRecipients, sendMessage, markMessageRead, getStaff } from '../../lib/supabase'
import { Card, Inp, TealBtn, GhostBtn } from '../../components/ui'

function fmtStamp(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function refFor(id) {
  // A short, stable reference so a thread can be quoted in writing.
  return 'REF-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase()
}

export default function Messages({ brand, role, showToast }) {
  const auth = (() => {
    try { return JSON.parse(localStorage.getItem('carehub_auth') || '{}') } catch (e) { return {} }
  })()
  const meStaffId = auth?.staff?.id || null
  const meName = auth?.staff?.full_name || auth?.brand?.owner || 'Owner'
  const meTitle = auth?.staff?.public_title || auth?.staff?.role || 'Owner'

  const [threads, setThreads] = useState([])
  const [recipientsByMsg, setRecipientsByMsg] = useState({})
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  const [openThread, setOpenThread] = useState(null)
  const [threadMsgs, setThreadMsgs] = useState([])
  const [threadRecips, setThreadRecips] = useState({})
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const [composing, setComposing] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [toIds, setToIds] = useState([])
  const [ccIds, setCcIds] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [brand?.id])

  async function load() {
    if (!brand?.id) return
    setLoading(true)
    try {
      const [ths, stf] = await Promise.all([getMessageThreads(brand.id), getStaff(brand.id)])
      setThreads(ths || [])
      setStaff(stf || [])
      const ids = (ths || []).map(t => t.id)
      const recips = await getMessageRecipients(ids)
      const map = {}
      ;(recips || []).forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setRecipientsByMsg(map)
    } catch (e) {
      alert('Could not load correspondence: ' + e.message)
    }
    setLoading(false)
  }

  // Everyone who can be addressed: all staff, plus the Owner.
  const addressBook = [
    { id: null, name: (brand?.owner || 'Owner') + ' (Owner)', title: 'Owner' },
    ...staff.map(s => ({ id: s.id, name: s.full_name, title: s.public_title || s.role })),
  ].filter(p => p.id !== meStaffId)

  const nameFor = (id) => addressBook.find(p => p.id === id)?.name || 'Unknown'

  const toggleTo = (id) => {
    setToIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setCcIds(prev => prev.filter(x => x !== id))
  }
  const toggleCc = (id) => {
    setCcIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setToIds(prev => prev.filter(x => x !== id))
  }

  async function send() {
    if (!subject.trim()) { alert('Please enter a subject.'); return }
    if (!body.trim()) { alert('Please write your message.'); return }
    if (toIds.length === 0) { alert('Please select at least one recipient in the "To" field.'); return }
    setSending(true)
    try {
      const recipients = [
        ...toIds.map(id => ({ staff_id: id, recipient_name: nameFor(id), kind: 'to' })),
        ...ccIds.map(id => ({ staff_id: id, recipient_name: nameFor(id), kind: 'cc' })),
      ]
      await sendMessage({
        business_id: brand.id,
        parent_id: null,
        sender_staff_id: meStaffId,
        sender_name: meName,
        sender_title: meTitle,
        subject: subject.trim(),
        body: body.trim(),
      }, recipients)
      showToast && showToast('Message sent')
      setSubject(''); setBody(''); setToIds([]); setCcIds([]); setComposing(false)
      load()
    } catch (e) {
      alert('Could not send: ' + e.message)
    }
    setSending(false)
  }

  async function openThreadView(t) {
    setOpenThread(t)
    setLoadingThread(true)
    setReplyBody('')
    try {
      const msgs = await getThreadMessages(t.id)
      setThreadMsgs(msgs || [])
      const ids = (msgs || []).map(m => m.id)
      const recips = await getMessageRecipients(ids)
      const map = {}
      ;(recips || []).forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setThreadRecips(map)

      // Mark my own unread rows on this thread as read.
      const mine = (recips || []).filter(r => r.staff_id === meStaffId && !r.read_at)
      for (const row of mine) {
        try { await markMessageRead(row.id) } catch (e) {}
      }
    } catch (e) {
      alert('Could not open thread: ' + e.message)
    }
    setLoadingThread(false)
  }

  async function sendReply() {
    if (!replyBody.trim()) { alert('Please write a reply.'); return }
    setSendingReply(true)
    try {
      // A reply goes to everyone already on the thread, except me.
      const root = threadMsgs[0]
      const everyone = new Set()
      threadMsgs.forEach(m => {
        if (m.sender_staff_id !== meStaffId) everyone.add(m.sender_staff_id)
        ;(threadRecips[m.id] || []).forEach(r => {
          if (r.staff_id !== meStaffId) everyone.add(r.staff_id)
        })
      })
      const recipients = [...everyone].map(id => ({
        staff_id: id,
        recipient_name: nameFor(id),
        kind: 'to',
      }))

      await sendMessage({
        business_id: brand.id,
        parent_id: root.id,
        sender_staff_id: meStaffId,
        sender_name: meName,
        sender_title: meTitle,
        subject: null,
        body: replyBody.trim(),
      }, recipients)
      showToast && showToast('Reply sent')
      setReplyBody('')
      openThreadView(openThread)
      load()
    } catch (e) {
      alert('Could not send reply: ' + e.message)
    }
    setSendingReply(false)
  }

  const unreadCount = (threadId) => {
    const rows = recipientsByMsg[threadId] || []
    return rows.filter(r => r.staff_id === meStaffId && !r.read_at).length
  }

  const toLine = (msgId) => (recipientsByMsg[msgId] || []).filter(r => r.kind === 'to').map(r => r.recipient_name).join(', ')
  const ccLine = (msgId) => (recipientsByMsg[msgId] || []).filter(r => r.kind === 'cc').map(r => r.recipient_name).join(', ')

  const tToLine = (msgId) => (threadRecips[msgId] || []).filter(r => r.kind === 'to').map(r => r.recipient_name).join(', ')
  const tCcLine = (msgId) => (threadRecips[msgId] || []).filter(r => r.kind === 'cc').map(r => r.recipient_name).join(', ')

  return (
    <div style={{ padding: '24px', maxWidth: '820px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.01em' }}>Internal Correspondence</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Official record of communication. Every message is logged with sender, recipients, and time.</div>
        </div>
        <TealBtn onClick={() => setComposing(true)}>+ New Message</TealBtn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f766e', letterSpacing: '0.04em' }}>SECURE</span>
        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Internal to {brand?.name || 'this company'} — not visible outside your organisation.</span>
      </div>

      {loading && <div style={{ color: '#888', fontSize: '13px' }}>Loading correspondence...</div>}

      {!loading && threads.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No correspondence yet</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Send an official message to your line manager, your team, or head office.</div>
          <TealBtn onClick={() => setComposing(true)}>+ New Message</TealBtn>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {threads.map(t => {
          const unread = unreadCount(t.id)
          return (
            <Card key={t.id} style={{ padding: '0', overflow: 'hidden', borderLeft: unread > 0 ? '3px solid #0f766e' : '3px solid transparent' }}>
              <button onClick={() => openThreadView(t)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '15px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: unread > 0 ? '900' : '700', color: '#0f172a' }}>{t.subject || '(no subject)'}</span>
                      {unread > 0 && <span style={{ fontSize: '9.5px', fontWeight: '800', padding: '2px 7px', borderRadius: '20px', background: '#0f766e', color: 'white', letterSpacing: '0.04em' }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '5px' }}>
                      <strong style={{ fontWeight: '700' }}>From:</strong> {t.sender_name}{t.sender_title ? ' · ' + t.sender_title : ''}
                    </div>
                    {toLine(t.id) && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        <strong style={{ fontWeight: '700' }}>To:</strong> {toLine(t.id)}
                      </div>
                    )}
                    {ccLine(t.id) && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                        <strong style={{ fontWeight: '700' }}>Cc:</strong> {ccLine(t.id)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600' }}>{fmtStamp(t.created_at)}</div>
                    <div style={{ fontSize: '9.5px', color: '#cbd5e1', fontFamily: 'monospace', marginTop: '3px' }}>{refFor(t.id)}</div>
                  </div>
                </div>
              </button>
            </Card>
          )
        })}
      </div>

      {composing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>New Message</div>
            <div style={{ fontSize: '11.5px', color: '#888', marginBottom: '16px' }}>Sending as <strong>{meName}</strong>{meTitle ? ' · ' + meTitle : ''}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Inp label='Subject' value={subject} onChange={v => setSubject(v)} placeholder='e.g. Q3 Territory Coverage Report' required />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>To <span style={{ color: '#dc2626' }}>*</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {addressBook.map(p => (
                    <button key={'to' + String(p.id)} type='button' onClick={() => toggleTo(p.id)}
                      style={{ fontSize: '11.5px', fontWeight: '600', padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                        border: toIds.includes(p.id) ? '1px solid #0f766e' : '1px solid #e2e8f0',
                        background: toIds.includes(p.id) ? '#0f766e' : 'white',
                        color: toIds.includes(p.id) ? 'white' : '#475569' }}>
                      {p.name}
                    </button>
                  ))}
                </div>
                {addressBook.length === 0 && <div style={{ fontSize: '11.5px', color: '#aaa', marginTop: '4px' }}>No one to send to yet — add staff first.</div>}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Cc <span style={{ fontWeight: '500', color: '#94a3b8' }}>(copied — they are notified and can see the thread)</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {addressBook.map(p => (
                    <button key={'cc' + String(p.id)} type='button' onClick={() => toggleCc(p.id)}
                      style={{ fontSize: '11.5px', fontWeight: '600', padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                        border: ccIds.includes(p.id) ? '1px solid #334155' : '1px solid #e2e8f0',
                        background: ccIds.includes(p.id) ? '#334155' : 'white',
                        color: ccIds.includes(p.id) ? 'white' : '#475569' }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Message <span style={{ color: '#dc2626' }}>*</span></div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={7}
                  placeholder='Write your message...'
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13.5px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={() => setComposing(false)} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={send} style={{ flex: 2, padding: '13px' }}>{sending ? 'Sending...' : 'Send Message'}</TealBtn>
            </div>
          </div>
        </div>
      )}

      {openThread && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#f8fafc', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0' }}>

            <div style={{ background: '#0f172a', color: 'white', padding: '18px 20px', borderRadius: '16px 16px 0 0', position: 'sticky', top: 0, zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: '900' }}>{openThread.subject || '(no subject)'}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>{refFor(openThread.id)}</div>
                </div>
                <button onClick={() => { setOpenThread(null); setThreadMsgs([]) }}
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              {loadingThread && <div style={{ color: '#888', fontSize: '13px' }}>Loading...</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {threadMsgs.map((m, i) => (
                  <div key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: '#fcfdfe' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{m.sender_name}</div>
                          {m.sender_title && <div style={{ fontSize: '11px', color: '#0f766e', fontWeight: '600' }}>{m.sender_title}</div>}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '600', textAlign: 'right', flexShrink: 0 }}>
                          {fmtStamp(m.created_at)}
                        </div>
                      </div>
                      {tToLine(m.id) && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                          <strong style={{ fontWeight: '700' }}>To:</strong> {tToLine(m.id)}
                        </div>
                      )}
                      {tCcLine(m.id) && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                          <strong style={{ fontWeight: '700' }}>Cc:</strong> {tCcLine(m.id)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '14px', fontSize: '13.5px', color: '#1e293b', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Reply</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Goes to everyone on this thread, including those copied.</div>
                <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={4}
                  placeholder='Write your reply...'
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }} />
                <TealBtn onClick={sendReply} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </TealBtn>
              </div>

              <div style={{ marginTop: '14px', fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
                This correspondence is an official company record.<br />Sender, recipients and timestamps are permanently logged.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
