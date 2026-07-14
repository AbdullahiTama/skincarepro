import { useState, useEffect, useRef } from 'react'
import {
  getActivityFields, addActivityField, deleteActivityField,
  getDefaultViewers, setDefaultViewers,
  getFieldActivities, getActivityViewers, getActivityReactions, getActivityComments,
  logActivity, reactToActivity, unreactToActivity, commentOnActivity,
  uploadActivityVoice, getStaff, getTerritories,
} from '../../lib/supabase'
import { watchTable } from '../../lib/realtime'
import { Card, Inp, TealBtn, GhostBtn } from '../../components/ui'

const FIELD_TYPES = ['text', 'long text', 'number', 'date', 'choice']

function fmtStamp(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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

export default function LiveActivity({ brand, showToast }) {
  const authData = readAuth()
  const meStaffId = (authData && authData.staff && authData.staff.id) ? authData.staff.id : null
  const meName = (authData && authData.staff && authData.staff.full_name)
    ? authData.staff.full_name
    : ((authData && authData.brand && authData.brand.owner) ? authData.brand.owner : 'Owner')
  const meTitle = (authData && authData.staff)
    ? (authData.staff.public_title || authData.staff.role || 'Staff')
    : 'Owner'
  const isOwner = meStaffId === null

  const [fields, setFields] = useState([])
  const [activities, setActivities] = useState([])
  const [viewersByAct, setViewersByAct] = useState({})
  const [reactionsByAct, setReactionsByAct] = useState({})
  const [commentsByAct, setCommentsByAct] = useState({})
  const [staffList, setStaffList] = useState([])
  const [territories, setTerritories] = useState([])
  const [myViewers, setMyViewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveOn, setLiveOn] = useState(false)

  const [logging, setLogging] = useState(false)
  const [values, setValues] = useState({})
  const [terrId, setTerrId] = useState('')
  const [overrideViewers, setOverrideViewers] = useState(null)
  const [voiceBlob, setVoiceBlob] = useState(null)
  const [voicePreview, setVoicePreview] = useState(null)
  const [recording, setRecording] = useState(false)
  const [gps, setGps] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const [settingUp, setSettingUp] = useState(false)
  const [newField, setNewField] = useState({ label: '', field_type: 'text', required: false, options: '' })

  const [pickingViewers, setPickingViewers] = useState(false)
  const [viewerDraft, setViewerDraft] = useState([])

  const [commentDrafts, setCommentDrafts] = useState({})
  const [openComments, setOpenComments] = useState({})

  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => { load() }, [brand?.id])

  // Live: when any rep logs an activity, it lands here without a refresh.
  useEffect(() => {
    if (!brand || !brand.id) return
    const stop = watchTable('field_activities', brand.id, function (row) {
      setActivities(function (prev) {
        if (prev.some(function (a) { return a.id === row.id })) return prev
        return [row].concat(prev)
      })
      setLiveOn(true)
    })
    setLiveOn(true)
    return function () {
      stop()
      setLiveOn(false)
    }
  }, [brand?.id])

  async function load() {
    if (!brand || !brand.id) return
    setLoading(true)
    try {
      const flds = await getActivityFields(brand.id)
      const acts = await getFieldActivities(brand.id)
      const stf = await getStaff(brand.id)
      const ters = await getTerritories(brand.id)
      setFields(flds || [])
      setActivities(acts || [])
      setStaffList(stf || [])
      setTerritories(ters || [])

      const ids = (acts || []).map(function (a) { return a.id })
      const vs = await getActivityViewers(ids)
      const vmap = {}
      ;(vs || []).forEach(function (v) {
        if (!vmap[v.activity_id]) vmap[v.activity_id] = []
        vmap[v.activity_id].push(v)
      })
      setViewersByAct(vmap)

      const rs = await getActivityReactions(ids)
      const rmap = {}
      ;(rs || []).forEach(function (r) {
        if (!rmap[r.activity_id]) rmap[r.activity_id] = []
        rmap[r.activity_id].push(r)
      })
      setReactionsByAct(rmap)

      const cs = await getActivityComments(ids)
      const cmap = {}
      ;(cs || []).forEach(function (c) {
        if (!cmap[c.activity_id]) cmap[c.activity_id] = []
        cmap[c.activity_id].push(c)
      })
      setCommentsByAct(cmap)

      if (meStaffId) {
        const dv = await getDefaultViewers(meStaffId)
        setMyViewers(dv || [])
      }
    } catch (e) {
      alert('Could not load activity: ' + e.message)
    }
    setLoading(false)
  }

  const people = staffList
    .map(function (s) { return { id: s.id, name: s.full_name, title: s.public_title || s.role } })
    .filter(function (p) { return p.id !== meStaffId })

  function nameFor(id) {
    const found = people.filter(function (p) { return p.id === id })[0]
    return found ? found.name : 'Unknown'
  }

  // ---- Field setup (owner defines what a visit record looks like) ----

  async function saveField() {
    if (!newField.label.trim()) { alert('Give the field a name.'); return }
    try {
      await addActivityField({
        business_id: brand.id,
        label: newField.label.trim(),
        field_type: newField.field_type,
        required: newField.required,
        options: newField.field_type === 'choice' ? (newField.options || null) : null,
        sort_order: fields.length,
      })
      if (showToast) showToast('Field added')
      setNewField({ label: '', field_type: 'text', required: false, options: '' })
      load()
    } catch (e) {
      alert('Could not add field: ' + e.message)
    }
  }

  async function removeField(id) {
    if (!window.confirm('Remove this field? Past records keep whatever was entered.')) return
    try {
      await deleteActivityField(id)
      if (showToast) showToast('Field removed')
      load()
    } catch (e) {
      alert('Could not remove: ' + e.message)
    }
  }

  // ---- Standing viewer list ----

  function openViewerPicker() {
    setViewerDraft(myViewers.map(function (v) { return v.viewer_staff_id }))
    setPickingViewers(true)
  }

  function toggleViewerDraft(id) {
    setViewerDraft(function (prev) {
      return prev.indexOf(id) >= 0 ? prev.filter(function (x) { return x !== id }) : prev.concat([id])
    })
  }

  async function saveViewers() {
    try {
      const viewers = viewerDraft.map(function (id) {
        return { viewer_staff_id: id, viewer_name: nameFor(id) }
      })
      await setDefaultViewers(brand.id, meStaffId, viewers)
      if (showToast) showToast('Saved — these people see your activity by default')
      setPickingViewers(false)
      load()
    } catch (e) {
      alert('Could not save: ' + e.message)
    }
  }

  // ---- Voice recording (free — stored in Supabase) ----

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = function () {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setVoiceBlob(blob)
        setVoicePreview(URL.createObjectURL(blob))
        stream.getTracks().forEach(function (t) { t.stop() })
      }
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch (e) {
      alert('Could not start recording: ' + e.message + '. Check that microphone access is allowed.')
    }
  }

  function stopRecording() {
    try {
      if (recorderRef.current) recorderRef.current.stop()
    } catch (e) {}
    setRecording(false)
  }

  function clearVoice() {
    setVoiceBlob(null)
    setVoicePreview(null)
  }

  // ---- Logging an activity ----

  function openLogger() {
    if (fields.length === 0) {
      alert('No activity fields set up yet. The Owner needs to define what a visit record looks like first.')
      return
    }
    setValues({})
    setTerrId('')
    setOverrideViewers(null)
    setVoiceBlob(null)
    setVoicePreview(null)
    setGps(null)
    setLogging(true)

    // Grab GPS quietly in the background. If it fails, we just log without it.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        function () {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  async function submitActivity() {
    const missing = fields.filter(function (f) {
      return f.required && !values[f.id]
    })
    if (missing.length > 0) {
      alert('Please fill in: ' + missing.map(function (f) { return f.label }).join(', '))
      return
    }

    setSaving(true)
    try {
      let voiceUrl = null
      if (voiceBlob) {
        setSaveStatus('Uploading voice note...')
        voiceUrl = await uploadActivityVoice(voiceBlob)
      }
      setSaveStatus('Saving...')

      const chosen = overrideViewers !== null
        ? overrideViewers
        : myViewers.map(function (v) { return v.viewer_staff_id })

      const viewers = chosen.map(function (id) {
        return { staff_id: id, viewer_name: nameFor(id) }
      })

      await logActivity({
        business_id: brand.id,
        staff_id: meStaffId,
        rep_name: meName,
        rep_title: meTitle,
        territory_id: terrId || null,
        values_json: JSON.stringify(values),
        voice_url: voiceUrl,
        lat: gps ? gps.lat : null,
        lng: gps ? gps.lng : null,
        location_label: null,
      }, viewers)

      if (showToast) showToast('Activity logged')
      setLogging(false)
      load()
    } catch (e) {
      alert('Could not log activity: ' + e.message)
    }
    setSaveStatus('')
    setSaving(false)
  }

  // ---- Reacting and commenting ----

  function myReaction(actId) {
    const rows = reactionsByAct[actId] || []
    return rows.filter(function (r) { return r.staff_id === meStaffId })[0]
  }

  async function toggleReaction(actId) {
    const existing = myReaction(actId)
    try {
      if (existing) {
        await unreactToActivity(existing.id)
      } else {
        await reactToActivity(actId, meStaffId, meName)
      }
      load()
    } catch (e) {
      alert('Could not react: ' + e.message)
    }
  }

  async function postComment(actId) {
    const text = (commentDrafts[actId] || '').trim()
    if (!text) return
    try {
      await commentOnActivity({
        activity_id: actId,
        staff_id: meStaffId,
        actor_name: meName,
        actor_title: meTitle,
        body: text,
      })
      setCommentDrafts(function (prev) {
        const next = { ...prev }
        next[actId] = ''
        return next
      })
      load()
    } catch (e) {
      alert('Could not comment: ' + e.message)
    }
  }

  // Only show activities I raised, or ones I was tagged to see. Owner sees all.
  const visible = activities.filter(function (a) {
    if (isOwner) return true
    if (a.staff_id === meStaffId) return true
    const vs = viewersByAct[a.id] || []
    return vs.some(function (v) { return v.staff_id === meStaffId })
  })

  function terrName(id) {
    const t = territories.filter(function (x) { return x.id === id })[0]
    return t ? t.name : null
  }

  function parseValues(json) {
    try { return JSON.parse(json || '{}') } catch (e) { return {} }
  }

  function labelFor(fieldId) {
    const f = fields.filter(function (x) { return x.id === fieldId })[0]
    return f ? f.label : null
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Live Field Activity</div>
            {liveOn && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '800', color: '#dc2626', background: '#fef2f2', padding: '3px 9px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
                LIVE
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
            Reps log what happens in the field. Tagged managers see it the moment it lands — and can reply.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isOwner && (
            <GhostBtn onClick={function () { setSettingUp(true) }} style={{ padding: '10px 14px' }}>Set up fields</GhostBtn>
          )}
          {!isOwner && (
            <GhostBtn onClick={openViewerPicker} style={{ padding: '10px 14px' }}>Who sees my activity</GhostBtn>
          )}
          <TealBtn onClick={openLogger}>+ Log Activity</TealBtn>
        </div>
      </div>

      {!isOwner && myViewers.length === 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#d97706' }}>Nobody is seeing your activity yet</div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>
            Tap "Who sees my activity" and pick your managers. Set it once and you never think about it again.
          </div>
        </div>
      )}

      {isOwner && fields.length === 0 && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#d97706' }}>No activity fields set up yet</div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>
            Tap "Set up fields" and decide what a visit record should capture — customer, products discussed, outcome, whatever suits your company.
          </div>
        </div>
      )}

      {loading && <div style={{ color: '#888', fontSize: '13px' }}>Loading...</div>}

      {!loading && visible.length === 0 && (
        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Nothing logged yet</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
            When a rep logs a visit, it appears here instantly.
          </div>
          <TealBtn onClick={openLogger}>+ Log Activity</TealBtn>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {visible.map(function (a) {
          const vals = parseValues(a.values_json)
          const reactions = reactionsByAct[a.id] || []
          const comments = commentsByAct[a.id] || []
          const viewers = viewersByAct[a.id] || []
          const iReacted = !!myReaction(a.id)
          const commentsOpen = !!openComments[a.id]

          return (
            <Card key={a.id} style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>{a.rep_name}</div>
                  {a.rep_title && <div style={{ fontSize: '11.5px', color: '#0f766e', fontWeight: '700' }}>{a.rep_title}</div>}
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    {timeAgo(a.created_at)} · {fmtStamp(a.created_at)}
                    {terrName(a.territory_id) ? ' · ' + terrName(a.territory_id) : ''}
                  </div>
                </div>
                {a.lat && a.lng && (
                  <a href={'https://www.google.com/maps?q=' + a.lat + ',' + a.lng} target='_blank' rel='noreferrer'
                    style={{ flexShrink: 0, fontSize: '11px', fontWeight: '700', color: '#0f766e', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '20px', padding: '5px 11px', textDecoration: 'none' }}>
                    View location
                  </a>
                )}
              </div>

              <div style={{ marginTop: '12px', background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                {Object.keys(vals).length === 0 && (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>No details entered.</div>
                )}
                {Object.keys(vals).map(function (fid) {
                  const label = labelFor(fid)
                  if (!label || !vals[fid]) return null
                  return (
                    <div key={fid} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{vals[fid]}</div>
                    </div>
                  )
                })}
              </div>

              {a.voice_url && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>Voice note</div>
                  <audio src={a.voice_url} controls preload='none' style={{ width: '100%', height: '38px' }} />
                </div>
              )}

              {viewers.length > 0 && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                  Seen by: {viewers.map(function (v) { return v.viewer_name }).join(', ')}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                <button onClick={function () { toggleReaction(a.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', border: iReacted ? '1px solid #0f766e' : '1px solid #e2e8f0',
                    background: iReacted ? '#f0fdfa' : 'white', color: iReacted ? '#0f766e' : '#64748b',
                    borderRadius: '20px', padding: '6px 13px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  {iReacted ? 'Acknowledged' : 'Acknowledge'}
                  {reactions.length > 0 ? ' · ' + reactions.length : ''}
                </button>

                <button onClick={function () {
                  setOpenComments(function (prev) {
                    const next = { ...prev }
                    next[a.id] = !prev[a.id]
                    return next
                  })
                }}
                  style={{ border: '1px solid #e2e8f0', background: 'white', color: '#64748b', borderRadius: '20px', padding: '6px 13px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Comment{comments.length > 0 ? ' · ' + comments.length : ''}
                </button>
              </div>

              {reactions.length > 0 && (
                <div style={{ fontSize: '11px', color: '#0f766e', marginTop: '8px', fontWeight: '600' }}>
                  {reactions.map(function (r) { return r.actor_name }).join(', ')} acknowledged this
                </div>
              )}

              {commentsOpen && (
                <div style={{ marginTop: '12px' }}>
                  {comments.map(function (c) {
                    return (
                      <div key={c.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                            {c.actor_name}{c.actor_title ? ' · ' + c.actor_title : ''}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#334155', marginTop: '3px', lineHeight: '1.5' }}>{c.body}</div>
                      </div>
                    )
                  })}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input value={commentDrafts[a.id] || ''}
                      onChange={function (e) {
                        const v = e.target.value
                        setCommentDrafts(function (prev) {
                          const next = { ...prev }
                          next[a.id] = v
                          return next
                        })
                      }}
                      onKeyDown={function (e) { if (e.key === 'Enter') postComment(a.id) }}
                      placeholder='Reply to the rep...'
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                    <button onClick={function () { postComment(a.id) }}
                      style={{ flexShrink: 0, background: '#0f766e', color: 'white', border: 'none', borderRadius: '20px', padding: '10px 16px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                      Send
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {logging && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Log Activity</div>
            <div style={{ fontSize: '11.5px', color: '#888', marginBottom: '16px' }}>
              {gps ? 'Location captured' : 'Getting your location...'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Territory</div>
                <select value={terrId} onChange={function (e) { setTerrId(e.target.value) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                  <option value=''>Not set</option>
                  {territories.map(function (t) { return <option key={t.id} value={t.id}>{t.name}</option> })}
                </select>
              </div>

              {fields.map(function (f) {
                const val = values[f.id] || ''
                const set = function (v) {
                  setValues(function (prev) {
                    const next = { ...prev }
                    next[f.id] = v
                    return next
                  })
                }
                return (
                  <div key={f.id}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      {f.label}{f.required ? ' *' : ''}
                    </div>

                    {f.field_type === 'long text' && (
                      <textarea value={val} onChange={function (e) { set(e.target.value) }} rows={4}
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                    )}

                    {f.field_type === 'choice' && (
                      <select value={val} onChange={function (e) { set(e.target.value) }}
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
                        <option value=''>Choose...</option>
                        {(f.options || '').split(',').map(function (opt) {
                          const t = opt.trim()
                          if (!t) return null
                          return <option key={t} value={t}>{t}</option>
                        })}
                      </select>
                    )}

                    {(f.field_type === 'text' || f.field_type === 'number' || f.field_type === 'date') && (
                      <input
                        type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
                        value={val} onChange={function (e) { set(e.target.value) }}
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                    )}
                  </div>
                )
              })}

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '2px' }}>Voice note</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                  Faster than typing. Say what happened — your managers can play it back.
                </div>

                {!voicePreview && !recording && (
                  <button type='button' onClick={startRecording}
                    style={{ width: '100%', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#0f766e', borderRadius: '10px', padding: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Start recording
                  </button>
                )}

                {recording && (
                  <button type='button' onClick={stopRecording}
                    style={{ width: '100%', border: 'none', background: '#dc2626', color: 'white', borderRadius: '10px', padding: '14px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                    ● Recording — tap to stop
                  </button>
                )}

                {voicePreview && (
                  <div>
                    <audio src={voicePreview} controls style={{ width: '100%', height: '38px' }} />
                    <button type='button' onClick={clearVoice}
                      style={{ marginTop: '6px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '7px 12px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
                      Remove voice note
                    </button>
                  </div>
                )}
              </div>

              {!isOwner && (
                <div style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Who sees this</div>
                  {overrideViewers === null ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {myViewers.length > 0
                          ? myViewers.map(function (v) { return v.viewer_name }).join(', ')
                          : 'Nobody — set your default viewers first.'}
                      </div>
                      {people.length > 0 && (
                        <button type='button'
                          onClick={function () { setOverrideViewers(myViewers.map(function (v) { return v.viewer_staff_id })) }}
                          style={{ marginTop: '8px', background: 'none', border: 'none', color: '#0f766e', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                          Change just for this one
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {people.map(function (p) {
                          const on = overrideViewers.indexOf(p.id) >= 0
                          return (
                            <button key={p.id} type='button'
                              onClick={function () {
                                setOverrideViewers(function (prev) {
                                  return prev.indexOf(p.id) >= 0
                                    ? prev.filter(function (x) { return x !== p.id })
                                    : prev.concat([p.id])
                                })
                              }}
                              style={{ fontSize: '11.5px', fontWeight: '600', padding: '7px 11px', borderRadius: '8px', cursor: 'pointer',
                                border: on ? '1px solid #0f766e' : '1px solid #e2e8f0',
                                background: on ? '#0f766e' : 'white',
                                color: on ? 'white' : '#475569' }}>
                              {p.name}
                            </button>
                          )
                        })}
                      </div>
                      <button type='button' onClick={function () { setOverrideViewers(null) }}
                        style={{ marginTop: '8px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                        Use my default list instead
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {saveStatus && (
              <div style={{ marginTop: '14px', padding: '9px 11px', borderRadius: '8px', background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: '12px', color: '#0f766e', fontWeight: '600' }}>
                {saveStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setLogging(false) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={submitActivity} style={{ flex: 2, padding: '13px' }}>{saving ? 'Saving...' : 'Log It'}</TealBtn>
            </div>
          </div>
        </div>
      )}

      {settingUp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Activity Fields</div>
            <div style={{ fontSize: '11.5px', color: '#888', marginBottom: '16px' }}>
              Decide what your reps record on every visit. Name them whatever suits your company.
            </div>

            {fields.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                {fields.map(function (f) {
                  return (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          {f.label}{f.required ? ' *' : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                          {f.field_type}{f.options ? ' — ' + f.options : ''}
                        </div>
                      </div>
                      <button onClick={function () { removeField(f.id) }}
                        style={{ flexShrink: 0, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>Add a field</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={newField.label}
                  onChange={function (e) { setNewField({ ...newField, label: e.target.value }) }}
                  placeholder='Field name — e.g. Customer, Products discussed, Outcome'
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />

                <select value={newField.field_type}
                  onChange={function (e) { setNewField({ ...newField, field_type: e.target.value }) }}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white', textTransform: 'capitalize' }}>
                  {FIELD_TYPES.map(function (t) { return <option key={t} value={t}>{t}</option> })}
                </select>

                {newField.field_type === 'choice' && (
                  <input value={newField.options}
                    onChange={function (e) { setNewField({ ...newField, options: e.target.value }) }}
                    placeholder='Options, separated by commas — e.g. Sold, Follow-up, No interest'
                    style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }} />
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
                  <input type='checkbox' checked={newField.required}
                    onChange={function (e) { setNewField({ ...newField, required: e.target.checked }) }} />
                  <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>Required — the rep must fill this in</span>
                </label>

                <TealBtn onClick={saveField} style={{ width: '100%', padding: '12px' }}>Add Field</TealBtn>
              </div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <GhostBtn onClick={function () { setSettingUp(false) }} style={{ width: '100%', padding: '13px' }}>Done</GhostBtn>
            </div>
          </div>
        </div>
      )}

      {pickingViewers && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Who sees my activity</div>
            <div style={{ fontSize: '11.5px', color: '#888', marginBottom: '16px' }}>
              Set this once. Everything you log goes to these people, live. You can still change it on any single activity.
            </div>

            {people.length === 0 && <div style={{ fontSize: '13px', color: '#aaa' }}>No colleagues to pick yet.</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {people.map(function (p) {
                const on = viewerDraft.indexOf(p.id) >= 0
                return (
                  <button key={p.id} onClick={function () { toggleViewerDraft(p.id) }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                      border: on ? '1px solid #0f766e' : '1px solid #e2e8f0',
                      background: on ? '#f0fdfa' : 'white' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{p.title}</div>
                    </div>
                    {on && <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f766e' }}>Selected</span>}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <GhostBtn onClick={function () { setPickingViewers(false) }} style={{ flex: 1, padding: '13px' }}>Cancel</GhostBtn>
              <TealBtn onClick={saveViewers} style={{ flex: 2, padding: '13px' }}>Save</TealBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
