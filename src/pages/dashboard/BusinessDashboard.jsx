import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import { Toast } from '../../components/ui'
import { getProducts, cacheData, getCached, syncOfflineSales } from '../../lib/supabase'
import { getNavItems, getPerms } from '../../lib/permissions'
import { businessName } from '../../lib/utils'

// Pages
import DashboardHome from './DashboardHome'
import POS from './POS'
import Inventory from './Inventory'
import Clients from './Clients'
import Appointments from './Appointments'
import Expenses from './Expenses'
import Debts from './Debts'
import Purchases from './Purchases'
import Staff from './Staff'
import Reports from './Reports'
import Settings from './Settings'
import CareFind from './CareFind'
import Locations from './Locations'
import Warehouses from './Warehouses'
import Territories from './Territories'
import Reception from './hospital/Reception'
import Triage from './hospital/Triage'
import Doctor from './hospital/Doctor'
import RxInbox from './hospital/RxInbox'
import Lab from './hospital/Lab'
import Imaging from './hospital/Imaging'
import ConsultationRouter from './ConsultationRouter'

const PAGE_TITLES = {
  dashboard: 'Dashboard', pos: 'POS / Sales', inventory: 'Inventory',
  clients: 'Clients', appointments: 'Appointments', consultation: 'Consultations',
  expenses: 'Expenses', debts: 'Debts', purchases: 'Purchases',
  staff: 'Staff', reports: 'Reports', settings: 'Settings', carefind: 'CareFind Profile',
  reception: 'Reception', triage: 'Triage', doctor: 'Doctor Consultation', rx_inbox: 'Prescription Inbox',
}

export default function BusinessDashboard() {
  const { auth, logout } = useAuth()
  const brand = auth?.brand
  const staffUser = auth?.staff
  const role = staffUser?.role || 'Owner'
  const perms = getPerms(role)
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [toast, setToast] = useState('')
  const [syncing, setSyncing] = useState(false)

  const showToast = (msg, dur = 3000) => { setToast(msg); setTimeout(() => setToast(''), dur) }

  useEffect(() => {
    if (!brand?.id) return
    loadProducts()
    if (navigator.onLine) {
      syncOfflineSales(brand.id).then(n => { if (n > 0) showToast(n + ' offline sale(s) synced!') })
    }
  }, [brand?.id])

  async function loadProducts() {
    try {
      const p = await getProducts(brand.id)
      if (p && p.length > 0) {
        setProducts(p)
        cacheData('products_' + brand.id, p)
      } else {
        const cached = getCached('products_' + brand.id)
        if (cached) setProducts(cached)
      }
    } catch (e) {
      const cached = getCached('products_' + brand.id)
      if (cached) setProducts(cached)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    const n = await syncOfflineSales(brand?.id)
    showToast(n > 0 ? n + ' sale(s) synced!' : 'All sales already synced.')
    setSyncing(false)
  }

  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const pageProps = { brand, products, setProducts, role, perms, showToast, loadProducts }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar brand={brand} role={role} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!online && (
          <div style={{ padding: '8px 20px', background: '#dc2626', color: 'white', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
            No internet — Offline mode. Sales will sync when connected.
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
          <Routes>
            <Route path='dashboard' element={<><TopBar title='Dashboard' brand={brand} role={role} /><div style={{ padding: '24px' }}><DashboardHome {...pageProps} /></div></>} />
            <Route path='pos' element={<POS {...pageProps} />} />
            <Route path='inventory' element={<><TopBar title='Inventory' brand={brand} role={role} /><div style={{ padding: '24px' }}><Inventory {...pageProps} /></div></>} />
            <Route path='clients' element={<><TopBar title={brand?.business_type === 'hospital' ? 'Patients' : 'Clients'} brand={brand} role={role} /><div style={{ padding: '24px' }}><Clients {...pageProps} /></div></>} />
            <Route path='appointments' element={<><TopBar title='Appointments' brand={brand} role={role} /><div style={{ padding: '24px' }}><Appointments {...pageProps} /></div></>} />
            <Route path='consultation' element={<><TopBar title='Consultations' brand={brand} role={role} /><div style={{ padding: '24px' }}><ConsultationRouter {...pageProps} /></div></>} />
            <Route path='expenses' element={<><TopBar title='Expenses' brand={brand} role={role} /><div style={{ padding: '24px' }}><Expenses {...pageProps} /></div></>} />
            <Route path='debts' element={<><TopBar title='Debts' brand={brand} role={role} /><div style={{ padding: '24px' }}><Debts {...pageProps} /></div></>} />
            <Route path='purchases' element={<><TopBar title='Purchases' brand={brand} role={role} /><div style={{ padding: '24px' }}><Purchases {...pageProps} /></div></>} />
            <Route path='staff' element={<><TopBar title='Staff' brand={brand} role={role} /><div style={{ padding: '24px' }}><Staff {...pageProps} /></div></>} />
            <Route path='reports' element={<><TopBar title='Reports' brand={brand} role={role} /><div style={{ padding: '24px' }}><Reports {...pageProps} /></div></>} />
            <Route path='settings' element={<><TopBar title='Settings' brand={brand} role={role} /><div style={{ padding: '24px' }}><Settings {...pageProps} /></div></>} />
            <Route path='carefind' element={<><TopBar title='CareFind Profile' brand={brand} role={role} /><div style={{ padding: '24px' }}><CareFind {...pageProps} /></div></>} />
            <Route path='locations' element={<><TopBar title='Locations' brand={brand} role={role} /><div style={{ padding: '24px' }}><Locations {...pageProps} /></div></>} />
            <Route path='warehouses' element={<Warehouses {...pageProps} />} />
            <Route path='territories' element={<Territories {...pageProps} />} />
            <Route path='reception' element={<><TopBar title='Reception' brand={brand} role={role} /><div style={{ padding: '24px' }}><Reception {...pageProps} /></div></>} />
            <Route path='triage' element={<><TopBar title='Triage' brand={brand} role={role} /><div style={{ padding: '24px' }}><Triage {...pageProps} /></div></>} />
            <Route path='doctor' element={<><TopBar title='Doctor Consultation' brand={brand} role={role} /><div style={{ padding: '24px' }}><Doctor {...pageProps} /></div></>} />
            <Route path='rx_inbox' element={<><TopBar title='Prescription Inbox' brand={brand} role={role} /><div style={{ padding: '24px' }}><RxInbox {...pageProps} /></div></>} />
            <Route path='lab' element={<><TopBar title='Laboratory' brand={brand} role={role} /><div style={{ padding: '24px' }}><Lab {...pageProps} /></div></>} />
            <Route path='imaging' element={<><TopBar title='Imaging / Radiology' brand={brand} role={role} /><div style={{ padding: '24px' }}><Imaging {...pageProps} /></div></>} />
            <Route path='*' element={<Navigate to='dashboard' />} />
          </Routes>
        </div>
      </div>
      <Toast msg={toast} />
    </div>
  )
}
