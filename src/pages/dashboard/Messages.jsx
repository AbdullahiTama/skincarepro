import { useState, useEffect } from 'react'
import { getMessageThreads, getThreadMessages, getMessageRecipients, sendMessage, markMessageRead, getStaff } from '../../lib/supabase'
import { Card, Inp, TealBtn, GhostBtn } from '../../components/ui'

function fmtStamp(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function refFor(id) {
  return 'REF-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase()
}

function readAuth() {
  try { return JSON.parse(localStorage.getItem('carehub_auth') || '{}') } catch (e) { return {} }
}

export default function Messages({ brand, showToast }) {
  const authData = readAuth()
  const meStaffId = (authData && authData.staff && authData.staff.id) ? authData.staff.id : null
  const meName = (authData && authData.staff && authData.staff.full_name)
    ? authData.staff.full_name
    : ((authData && authData.brand && authData.brand.owner) ? authData.brand.owner : 'Owner')
  const meTitle = (authData && authData.staff)
    ? (authData.staff.public_title || authData.staff.role || 'Staff')
    : 'Owner'

  const [threads, setThreads] = useState([])
  const [recipientsByMsg, setRecipientsByMsg] = useState({})
  const [staffList, setStaffList] = useState([])
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
    if (!brand || !brand.id) return
    setLoading(true)
    try {
      const ths = await getMessageThreads(brand.id)
      const stf = await getStaff(brand.id)
      setThreads(ths || [])
      setStaffList(stf || [])
      const ids = (ths || []).map(function (t) { return t.id })
      const recips = await getMessageRecipients(ids)
      const map = {}
      ;(recips || []).forEach(function (r) {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setRecipientsByMsg(map)
    } catch (e) {
      alert('Could not load correspondence: ' + e.message)
    }
    setLoading(false)
  }

  const ownerName = (brand && brand.owner) ? brand.owner : 'Owner'
  const addressBook = [{ id: 'OWNER', name: ownerName + ' (Owner)', title: 'Owner' }]
    .concat(staffList.map(function (s) {
      return { id: s.id, name: s.full_name, title: s.public_title || s.role }
    }))
    .filter(function (p) {
      if (meStaffId === null) return p.id !== 'OWNER'
      return p.id !== meStaffId
    })

  function nameFor(id) {
    const found = addressBook.filter(function (p) { return p.id === id })[0]
    return found ? found.name : 'Unknown'
  }

  function staffIdFor(id) {
    return id === 'OWNER' ? null : id
  }

  function toggleTo(id) {
    setToIds(function (prev) {
      return prev.indexOf(id) >= 0 ? prev.filter(function (x) { return x !== id }) : prev.concat([id])
    })
    setCcIds(function (prev) { return prev.filter(function (x) { return x !== id }) })
  }

  function toggleCc(id) {
    setCcIds(function (prev) {
      return prev.indexOf(id) >= 0 ? prev.filter(function (x) { return x !== id }) : prev.concat([id])
    })
    setToIds(function (prev) { return prev.filter(function (x) { return x !== id }) })
  }

  async function send() {
    if (!subject.trim()) { alert('Please enter a subject.'); return }
    if (!body.trim()) { alert('Please write your message.'); return }
    if (toIds.length === 0) { alert('Please select at least one recipient in the "To" field.'); return }
    setSending(true)
    try {
      const recipients = toIds.map(function (id) {
        return { staff_id: staffIdFor(id), recipient_name: nameFor(id), kind: 'to' }
      }).concat(ccIds.map(function (id) {
        return { staff_id: staffIdFor(id), recipient_name: nameFor(id), kind: 'cc' }
      }))

      await sendMessage({
        business_id: brand.id,
        parent_id: null,
        sender_staff_id: meStaffId,
        sender_name: meName,
        sender_title: meTitle,
        subject: subject.trim(),
        body: body.trim(),
      }, recipients)

      if (showToast) showToast('Message sent')
      setSubject('')
      setBody('')
      setToIds([])
      setCcIds([])
      setComposing(false)
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
      const ids = (msgs || []).map(function (m) { return m.id })
      const recips = await getMessageRecipients(ids)
      const map = {}
      ;(recips || []).forEach(function (r) {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setThreadRecips(map)

      const mine = (recips || []).filter(function (r) {
        return r.staff_id === meStaffId && !r.read_at
      })
      for (let i = 0; i < mine.length; i++) {
        try { await markMessageRead(mine[i].id) } catch (e) {}
      }
    } catch (e) {
      alert('Could not open thread: ' + e.message)
    }
    setLoadingThread(false)
  }

  async function sendReply() {
    if (!replyBody.trim()) { alert('Please write a reply.'); return }
    if (threadMsgs.length === 0) { alert('Thread not loaded.'); return }
    setSendingReply(true)
    try {
      const root = threadMsgs[0]
      const seen = {}
      const recipients = []

      threadMsgs.forEach(function (m) {
        if (m.sender_staff_id !== meStaffId) {
          const key = String(m.sender_staff_id)
          if (!seen[key]) {
            seen[key] = true
            recipients.push({ staff_id: m.sender_staff_id, recipient_name: m.sender_name, kind: 'to' })
          }
        }
        const rows = threadRecips[m.id] || []
        rows.forEach(function (r) {
          if (r.staff_id !== meStaffId) {
            const key = String(r.staff_id)
            if (!seen[key]) {
              seen[key] = true
              recipients.push({ staff_id: r.staff_id, recipient_name: r.recipient_name, kind: 'to' })
            }
          }
        })
      })

      await sendMessage({
        business_id: brand.id,
        parent_id: root.id,
        sender_staff_id: meStaffId,
        sender_name: meName,
        sender_title: meTitle,
        subject: null,
        body: replyBody.trim(),
      }, recipients)

      if (showToast) showToast('Reply sent')
      setReplyBody('')
      openThreadView(openThread)
      load()
    } catch (e) {
      alert('Could not send reply: ' + e.message)
    }
    setSendingReply(false)
  }

  function unreadCount(threadId) {
    const rows = recipientsByMsg[threadId] || []
    return rows.filter(function (r) { return r.staff_id === meStaffId && !r.read_at }).length
  }

  function toLine(msgId) {
    return (recipientsByMsg[msgId] || []).filter(function (r) { return r.kind === 'to' })
      .map(function (r) { return r.recipient_name }).join(', ')
  }

  function ccLine(msgId) {
    return (recipientsByMsg[msgId] || []).filter(function (r) { return r.kind === 'cc' })
      .map(function (r) { return r.recipient_name }).join(', ')
  }

  function tToLine(msgId) {
    return (threadRecips[msgId] || []).filter(function (r) { return r.kind === 'to' })
      .map(function (r) { return r.recipient_name }).join(', ')
  }

  function tCcLine(msgId) {
    return (threadRecips[msgId] || []).filter(function (r) { return r.kind === 'cc' })
      .map(function (r) { return r.recipient_name }).join(', ')
  }

  return (
    <div style={{ padding: '24px', maxWidth: '820px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Internal Correspondence</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Official record of communication. Every message is logged with sender, recipients, and time.</div>
        </div>
        <TealBtn onClick={function () { setComposing(true) }}>+ New Message</TealBtn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f766e', letterSpacing: '0.04em' }}>SECURE</span>
        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Internal to {brand && brand.name ? brand.name : 'this company'} — not visible outside your organisation.</span>
      </div>

      {loading && <div style={{ color: '#888', fontSize: '13px' }}>Loading correspondence...</div>}

      {!loading && threads.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No correspondence yet</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Send an official message to your line manager, your team, or head office.</div>
          <TealBtn onClick={function () { setComposing(true) }}>+ New Message</TealBtn>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {threads.map(function (t) {
          const unread = unreadCount(t.id)
          return (
            <Card key={t.id} style={{ padding: '0', overflow: 'hidden', borderLeft: unread > 0 ? '3px solid #0f766e' : '3px solid transparent' }}>
              <button onClick={function () { openThreadView(t) }}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '15px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: unread > 0 ? '900' : '700', color: '#0f172a' }}>{t.subject || '(no subject)'}</span>
                      {unread > 0 && <span style={{ fontSize: '9.5px', fontWeight: '800', padding: '2px 7px', borderRadius: '20px', background: '#0f766e', color: 'white' }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '5px' }}>
                      <strong>From:</strong> {t.sender_name}{t.sender_title ? ' · ' + t.sender_title : ''}
                    </div>
                    {toLine(t.id) && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        <strong>To:</strong> {toLine(t.id)}
                      </div>
                    )}
                    {ccLine(t.id) && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                        <strong>Cc:</strong> {ccLine(t.id)}
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
              <Inp label='Subject' value={subject} onChange={function (v) { setSubject(v) }} placeholder='e.g. Q3 Territory Coverage Report' required />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>To *</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {addressBook.map(function (p) {
                    const on = toIds.indexOf(p.id) >= 0
                    return (
                      <button key={'to' + String(p.id)} type='button' onClick={function () { toggleTo(p.id) }}
                        style={{ fontSize: '11.5px', fontWeight: '600', padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                          border: on ? '1px solid #0f766e' : '1px solid #e2e8f0',
                          background: on ? '#0f766e' : 'white',
                          color: on ? 'white' : '#475569' }}>
                        {p.name}
                      </button>
                    )
                  })}
                </div>
                {addressBook.length === 0 && <div style={{ fontSize: '11.5px', color: '#aaa', marginTop: '4px' }}>No one to send to yet — add staff first.</div>}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Cc (copied — they are notified and can see the thread)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {addressBook.map(function (p) {
                    const on = ccIds.indexOf(p.id) >= 0
                    return (
                      <button key={'cc' + String(p.id)} type='button' onClick={function () { toggleCc(p.id) }}
                        style={{ fontSize: '11.5px', fontWeight: '600', padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                          border: on ? '1px solid #334155' : '1px solid #e2e8f0',
                          background: on ? '#334155' : 'white',
                          color: on ? 'white' : '#475569' }}>
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Message *</div>
                <textarea value={body} onChange={function (e) { setBody(e.target.value) }} rows={7}
                  placeholder='Write your message...'
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13.5px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setComposing(false) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
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
                <button onClick={function () { setOpenThread(null); setThreadMsgs([]) }}
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              {loadingThread && <div style={{ color: '#888', fontSize: '13px' }}>Loading...</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {threadMsgs.map(function (m) {
                  return (
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
                            <strong>To:</strong> {tToLine(m.id)}
                          </div>
                        )}
                        {tCcLine(m.id) && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                            <strong>Cc:</strong> {tCcLine(m.id)}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '14px', fontSize: '13.5px', color: '#1e293b', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                        {m.body}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: '18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Reply</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Goes to everyone on this thread, including those copied.</div>
                <textarea value={replyBody} onChange={function (e) { setReplyBody(e.target.value) }} rows={4}
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
