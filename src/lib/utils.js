export const TEAL = 'linear-gradient(135deg,#0f766e,#14b8a6)'
export const DARK = 'linear-gradient(135deg,#0f172a,#1e3a5f)'
export const TEALC = '#0f766e'

export const fmt = (n) => '₦' + Number(n || 0).toLocaleString()
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG') : '—'
export const todayDate = () => new Date().toISOString().split('T')[0]
export const nowStr = () => new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
export const currentMonth = () => new Date().toISOString().slice(0, 7)
export const genId = (prefix = 'TXN') => prefix + Math.floor(Math.random() * 900000 + 100000)

export const BUSINESS_TYPES = [
  { id: 'skincare',            icon: '🧴', name: 'Skincare / Aesthetic Spa' },
  { id: 'pharmacy',            icon: '💊', name: 'Community Pharmacy' },
  { id: 'hospital',            icon: '🏥', name: 'Hospital / Clinic' },
  { id: 'dental',              icon: '🦷', name: 'Dental Clinic' },
  { id: 'optical',             icon: '👁', name: 'Optical / Eye Clinic' },
  { id: 'wellness',            icon: '🌿', name: 'Wellness & Nutrition Center' },
  { id: 'manufacturer_importer', icon: '🏭', name: 'Manufacturer / Importer' },
  { id: 'wholesale',           icon: '📦', name: 'Wholesale / Distributor' },
]

export const businessIcon = (type) => BUSINESS_TYPES.find(b => b.id === type)?.icon || '🏥'
export const businessName = (type) => BUSINESS_TYPES.find(b => b.id === type)?.name || 'Healthcare'

export const NIG_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara']

export const EXPENSE_CATS = ['Rent','Salary','Utilities','Supplies','Equipment','Transport','Marketing','Maintenance','Insurance','Tax','Other']

export const PRODUCT_CATS = ['Medicines','Skincare','Cosmetics','Services','Consumables','Equipment','Tools','Other']

export const PRODUCT_EMOJIS = ['💊','🧴','☀️','🫧','✨','💆','💎','🩺','🩸','🧤','📦','🌿','🔧','💉','🩹','🫀','🧬','🏥']
