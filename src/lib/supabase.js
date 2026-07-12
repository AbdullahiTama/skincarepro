const SB_URL = 'https://szdybxmgmhndoytqanfb.supabase.co'
const SB_KEY = 'sb_publishable_xEs5f4L6qSxqXikPZM06SQ_TKy4UNFz'

async function sbFetch(path, options = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    method: options.method || 'GET',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
    },
    body: options.body || undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    let detail = text
    try { detail = JSON.parse(text).message || text } catch (e) {}
    throw new Error('Supabase error (' + res.status + '): ' + detail)
  }
  return text ? JSON.parse(text) : []
}

// AUTH
export async function loginBusiness(email, password) {
  const r = await sbFetch('businesses?email=eq.' + encodeURIComponent(email) + '&password=eq.' + encodeURIComponent(password) + '&select=*')
  return r[0] || null
}
export async function loginStaff(email, password) {
  const r = await sbFetch('staff?email=eq.' + encodeURIComponent(email) + '&password=eq.' + encodeURIComponent(password) + '&status=eq.active&select=*')
  return r[0] || null
}
export async function getBusinessById(id) {
  const r = await sbFetch('businesses?id=eq.' + id + '&select=*')
  return r[0] || null
}

// BUSINESSES
export async function getBusinesses() { return sbFetch('businesses?select=*&order=created_at.desc') }
export async function registerBusiness(data) { return sbFetch('businesses', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateBusiness(id, data) { return sbFetch('businesses?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function getBranches(parentId) { return sbFetch('businesses?parent_business_id=eq.' + parentId + '&select=*') }
export async function addBranch(data) { return sbFetch('businesses', { method: 'POST', body: JSON.stringify(data) }) }
export async function getAllLocations(mainBusinessId) {
  const main = await getBusinessById(mainBusinessId)
  if (!main) return []
  const parentId = main.parent_business_id || mainBusinessId
  const parent = main.parent_business_id ? await getBusinessById(parentId) : main
  const branches = await getBranches(parentId)
  return parent ? [parent, ...branches] : branches
}

// STAFF
export async function getStaff(businessId) { return sbFetch('staff?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addStaff(data) { return sbFetch('staff', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateStaff(id, data) { return sbFetch('staff?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function deleteStaff(id) { return sbFetch('staff?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// PRODUCTS
export async function getProducts(businessId) { return sbFetch('products?business_id=eq.' + businessId + '&order=name.asc&select=*') }
export async function addProduct(data) { return sbFetch('products', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateProduct(id, data) { return sbFetch('products?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function deleteProduct(id) { return sbFetch('products?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }
export async function deleteProductsBulk(ids) {
  if (!ids || ids.length === 0) return
  return sbFetch('products?id=in.(' + ids.join(',') + ')', { method: 'DELETE', prefer: 'return=minimal' })
}

// SALES
export async function getSales(businessId, filters = {}) {
  let query = 'sales?business_id=eq.' + businessId + '&order=created_at.desc&select=*'
  if (filters.date) query += '&created_at=gte.' + filters.date + 'T00:00:00'
  if (filters.onHold !== undefined) query += '&is_on_hold=eq.' + filters.onHold
  if (filters.isCredit !== undefined) query += '&is_credit=eq.' + filters.isCredit
  return sbFetch(query)
}
export async function addSale(data) { return sbFetch('sales', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateSale(id, data) { return sbFetch('sales?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function getTodaySales(businessId) {
  const today = new Date().toISOString().split('T')[0]
  return sbFetch('sales?business_id=eq.' + businessId + '&created_at=gte.' + today + 'T00:00:00&is_on_hold=eq.false&order=created_at.desc&select=*')
}

// CLIENTS
export async function getClients(businessId) { return sbFetch('clients?business_id=eq.' + businessId + '&order=full_name.asc&select=*') }
export async function addClient(data) { return sbFetch('clients', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateClient(id, data) { return sbFetch('clients?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function searchClients(businessId, query) {
  return sbFetch('clients?business_id=eq.' + businessId + '&full_name=ilike.*' + encodeURIComponent(query) + '*&select=*')
}

// EXPENSES
export async function getExpenses(businessId) { return sbFetch('expenses?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addExpense(data) { return sbFetch('expenses', { method: 'POST', body: JSON.stringify(data) }) }
export async function deleteExpense(id) { return sbFetch('expenses?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// APPOINTMENTS
export async function getAppointments(businessId) { return sbFetch('appointments?business_id=eq.' + businessId + '&order=date.asc&select=*') }
export async function addAppointment(data) { return sbFetch('appointments', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateAppointment(id, data) { return sbFetch('appointments?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function deleteAppointment(id) { return sbFetch('appointments?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// DEBTS
export async function getDebts(businessId) { return sbFetch('debts?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addDebt(data) { return sbFetch('debts', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateDebt(id, data) { return sbFetch('debts?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }

// PURCHASES
export async function getPurchases(businessId) { return sbFetch('purchases?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addPurchase(data) { return sbFetch('purchases', { method: 'POST', body: JSON.stringify(data) }) }
export async function updatePurchase(id, data) { return sbFetch('purchases?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }

// PATIENTS (hospital)
export async function getPatients(businessId) { return sbFetch('patients?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addPatient(data) { return sbFetch('patients', { method: 'POST', body: JSON.stringify(data) }) }
export async function updatePatient(id, data) { return sbFetch('patients?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function getTriage(patientId) { const r = await sbFetch('triage?patient_id=eq.' + patientId + '&select=*'); return r[0] || null }
export async function addTriage(data) { return sbFetch('triage', { method: 'POST', body: JSON.stringify(data) }) }
export async function addConsultation(data) { return sbFetch('consultations', { method: 'POST', body: JSON.stringify(data) }) }
export async function getPrescriptions(businessId) { return sbFetch('prescriptions?business_id=eq.' + businessId + '&order=created_at.desc&select=*') }
export async function addPrescription(data) { return sbFetch('prescriptions', { method: 'POST', body: JSON.stringify(data) }) }
export async function updatePrescription(id, data) { return sbFetch('prescriptions?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }

// SETTINGS
export async function getSettings(businessId) {
  const r = await sbFetch('business_settings?business_id=eq.' + businessId + '&select=*')
  return r[0] || null
}
export async function saveSettings(businessId, data) {
  const existing = await getSettings(businessId)
  if (existing) {
    return sbFetch('business_settings?business_id=eq.' + businessId, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' })
  }
  return sbFetch('business_settings', { method: 'POST', body: JSON.stringify({ ...data, business_id: businessId }) })
}

// ADMIN TEAM
export async function getAdminTeam() { return sbFetch('admin_team?select=*&order=created_at.desc') }
export async function addAdminTeam(data) { return sbFetch('admin_team', { method: 'POST', body: JSON.stringify(data) }) }
export async function removeAdminTeam(id) { return sbFetch('admin_team?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// ENTERPRISE LOCATIONS
export async function getEnterpriseLocations(businessId) { return sbFetch('enterprise_locations?business_id=eq.' + businessId + '&order=created_at.asc&select=*') }
export async function addEnterpriseLocation(data) { return sbFetch('enterprise_locations', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateEnterpriseLocation(id, data) { return sbFetch('enterprise_locations?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function deleteEnterpriseLocation(id) { return sbFetch('enterprise_locations?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// STAFF CLAIMS
export async function getStaffClaims(businessId) {
  return sbFetch('staff_claims?select=id,status,created_at,staff_id,staff:staff_id(id,full_name,public_title,business_id)&staff.business_id=eq.' + businessId + '&status=eq.pending')
}
export async function approveStaffClaim(id) { return sbFetch('staff_claims?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }), prefer: 'return=minimal' }) }
export async function rejectStaffClaim(id) { return sbFetch('staff_claims?id=eq.' + id, { method: 'PATCH', body: JSON.stringify({ status: 'rejected' }), prefer: 'return=minimal' }) }

// TERRITORIES
export async function getTerritories(businessId) { return sbFetch('territories?business_id=eq.' + businessId + '&order=created_at.asc&select=*') }
export async function addTerritory(data) { return sbFetch('territories', { method: 'POST', body: JSON.stringify(data) }) }
export async function updateTerritory(id, data) { return sbFetch('territories?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(data), prefer: 'return=minimal' }) }
export async function deleteTerritory(id) { return sbFetch('territories?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }
export async function getRepAssignments(territoryIds) {
  if (!territoryIds || territoryIds.length === 0) return []
  return sbFetch('rep_territories?territory_id=in.(' + territoryIds.join(',') + ')&select=id,staff_id,territory_id,staff:staff_id(id,full_name,public_title)')
}
export async function assignRepToTerritory(staffId, territoryId) { return sbFetch('rep_territories', { method: 'POST', body: JSON.stringify({ staff_id: staffId, territory_id: territoryId }) }) }
export async function removeRepFromTerritory(id) { return sbFetch('rep_territories?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }) }

// INTERNAL MESSAGES (official correspondence — To, CC, threaded replies)
export async function getMessageThreads(businessId) {
  return sbFetch('internal_messages?business_id=eq.' + businessId + '&parent_id=is.null&order=created_at.desc&select=*')
}
export async function getThreadMessages(rootId) {
  return sbFetch('internal_messages?or=(id.eq.' + rootId + ',parent_id.eq.' + rootId + ')&order=created_at.asc&select=*')
}
export async function getMessageRecipients(messageIds) {
  if (!messageIds || messageIds.length === 0) return []
  return sbFetch('internal_message_recipients?message_id=in.(' + messageIds.join(',') + ')&select=*')
}
export async function sendMessage(message, recipients) {
  const rows = await sbFetch('internal_messages', { method: 'POST', body: JSON.stringify(message) })
  const saved = Array.isArray(rows) ? rows[0] : rows
  if (!saved || !saved.id) throw new Error('Message was not saved — no id returned.')
  if (recipients && recipients.length > 0) {
    const payload = recipients.map(function (r) { return { ...r, message_id: saved.id } })
    await sbFetch('internal_message_recipients', { method: 'POST', body: JSON.stringify(payload), prefer: 'return=minimal' })
  }
  return saved
}
export async function markMessageRead(recipientRowId) {
  return sbFetch('internal_message_recipients?id=eq.' + recipientRowId, { method: 'PATCH', body: JSON.stringify({ read_at: new Date().toISOString() }), prefer: 'return=minimal' })
}

// OFFLINE SUPPORT
const CACHE = 'carehub_v1'
export function cacheData(key, data) {
  try { localStorage.setItem(CACHE + '_' + key, JSON.stringify(data)) } catch (e) {}
}
export function getCached(key) {
  try { const d = localStorage.getItem(CACHE + '_' + key); return d ? JSON.parse(d) : null } catch (e) { return null }
}
export function queueOfflineSale(sale) {
  try {
    const q = JSON.parse(localStorage.getItem(CACHE + '_offline_sales') || '[]')
    q.push({ ...sale, _offline_id: Date.now() })
    localStorage.setItem(CACHE + '_offline_sales', JSON.stringify(q))
  } catch (e) {}
}
export function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(CACHE + '_offline_sales') || '[]') } catch (e) { return [] }
}
export function clearOfflineQueue() {
  try { localStorage.removeItem(CACHE + '_offline_sales') } catch (e) {}
}
export async function syncOfflineSales(businessId) {
  if (!navigator.onLine) return 0
  const queue = getOfflineQueue()
  if (!queue.length) return 0
  let count = 0
  for (const sale of queue) {
    try {
      const { _offline_id, ...data } = sale
      await addSale({ ...data, business_id: businessId })
      count++
    } catch (e) {}
  }
  if (count > 0) clearOfflineQueue()
  return count
}
