import { createClient } from '@supabase/supabase-js'

const SB_URL = 'https://szdybxmgmhndoytqanfb.supabase.co'
const SB_KEY = 'sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz'

// This client exists ONLY to listen for live updates over a websocket.
// Every other database call in CareHub still goes through sbFetch in supabase.js.
// Nothing else changes.
export const realtime = createClient(SB_URL, SB_KEY, {
  auth: { persistSession: false },
})

// Listens for new rows on a table for one business, and calls back when one arrives.
// Returns an unsubscribe function — always call it when the page closes,
// or the connection stays open and drains the phone battery.
export function watchTable(tableName, businessId, onInsert) {
  const channel = realtime
    .channel('watch-' + tableName + '-' + businessId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: 'business_id=eq.' + businessId,
      },
      function (payload) {
        if (onInsert) onInsert(payload.new)
      }
    )
    .subscribe()
oi
  return function unsubscribe() {
    try { realtime.removeChannel(channel) } catch (e) {}
  }
}

// Same, but filtered by activity instead of business — for comments and reactions
// arriving on one specific activity.
export function watchActivityChildren(tableName, activityId, onInsert) {
  const channel = realtime
    .channel('watch-' + tableName + '-' + activityId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter: 'activity_id=eq.' + activityId,
      },
      function (payload) {
        if (onInsert) onInsert(payload.new)
      }
    )
    .subscribe()

  return function unsubscribe() {
    try { realtime.removeChannel(channel) } catch (e) {}
  }
}
