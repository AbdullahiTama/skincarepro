export const ROLES = {
  Owner: {
    nav: ['dashboard','pos','inventory','clients','appointments','consultation','expenses','debts','purchases','staff','reports','settings','carefind','locations','warehouses','territories','messages','stock','orders','reception','triage','doctor','rx_inbox','lab','imaging'],
    canEditPrice: true,
    canEditStock: true,
    canDelete: true,
    canViewReports: true,
    canExportReports: true,
    canManageStaff: true,
    canViewFinance: true,
    canMakeSales: true,
    canViewSettings: true,
    label: 'Owner — Full Access',
  },
  Manager: {
    nav: ['dashboard','pos','inventory','clients','appointments','consultation','expenses','debts','purchases','reports','carefind','messages','stock','orders'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: true,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: true,
    canMakeSales: true,
    canViewSettings: false,
    label: 'Manager',
  },
  Pharmacist: {
    nav: ['dashboard','pos','inventory','clients','consultation','rx_inbox'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: true,
    canViewSettings: false,
    label: 'Pharmacist',
  },
  Therapist: {
    nav: ['dashboard','pos','clients','appointments','consultation'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: true,
    canViewSettings: false,
    label: 'Therapist',
  },
  Receptionist: {
    nav: ['dashboard','clients','appointments','reception'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: false,
    canViewSettings: false,
    label: 'Receptionist',
  },
  Cashier: {
    nav: ['dashboard','pos','clients'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: true,
    canViewSettings: false,
    label: 'Cashier',
  },
  Nurse: {
    nav: ['dashboard','triage','clients'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: false,
    canViewSettings: false,
    label: 'Nurse',
  },
  Doctor: {
    nav: ['dashboard','doctor','consultation','clients'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: false,
    canViewSettings: false,
    label: 'Doctor',
  },
  'Lab Technician': {
    nav: ['dashboard','lab','clients'],
    canEditPrice: false,
    canEditStock: false,
    canDelete: false,
    canViewReports: false,
    canExportReports: false,
    canManageStaff: false,
    canViewFinance: false,
    canMakeSales: false,
    canViewSettings: false,
    label: 'Lab Technician',
  },
}

// Fallback for any role name not in ROLES above — used for custom-typed titles
// (Manufacturer/Importer and Wholesale let companies type their own role names,
// so "Regional Manager", "Business Development Manager" etc won't be in the list above).
export const DEFAULT_STAFF_PERMS = {
  nav: ['dashboard', 'warehouses', 'territories', 'messages', 'stock', 'orders', 'reports', 'carefind'],
  canEditPrice: false,
  canEditStock: false,
  canDelete: false,
  canViewReports: true,
  canExportReports: false,
  canManageStaff: false,
  canViewFinance: false,
  canMakeSales: false,
  canViewSettings: false,
  label: 'Staff',
}

export function getPerms(role) {
  return ROLES[role] || DEFAULT_STAFF_PERMS
}

export function can(role, action) {
  return getPerms(role)[action] || false
}

export const ALL_NAV_DEFAULT = [
  ['dashboard', '🏠', 'Dashboard'],
  ['pos', '🛒', 'POS / Sales'],
  ['inventory', '📦', 'Inventory'],
  ['clients', '👥', 'Clients'],
  ['appointments', '📅', 'Appointments'],
  ['consultation', '📋', 'Consultations'],
  ['expenses', '💸', 'Expenses'],
  ['debts', '🏦', 'Debts'],
  ['purchases', '🚚', 'Purchases'],
  ['carefind', '🔍', 'CareFind Profile'],
  ['locations', '🏢', 'Locations'],
  ['staff', '👤', 'Staff'],
  ['reports', '📊', 'Reports'],
  ['settings', '⚙️', 'Settings'],
]

export const ALL_NAV_HOSPITAL = [
  ['dashboard', '🏠', 'Dashboard'],
  ['reception', '👩‍💼', 'Reception'],
  ['triage', '🏥', 'Triage'],
  ['doctor', '👨‍⚕️', 'Doctor'],
  ['rx_inbox', '💊', 'Rx Inbox'],
  ['lab', '🔬', 'Laboratory'],
  ['imaging', '🩻', 'Imaging'],
  ['pos', '🛒', 'POS / Sales'],
  ['inventory', '📦', 'Inventory'],
  ['clients', '👥', 'Patients'],
  ['expenses', '💸', 'Expenses'],
  ['debts', '🏦', 'Debts'],
  ['purchases', '🚚', 'Purchases'],
  ['carefind', '🔍', 'CareFind Profile'],
  ['locations', '🏢', 'Locations'],
  ['staff', '👤', 'Staff'],
  ['reports', '📊', 'Reports'],
  ['settings', '⚙️', 'Settings'],
]

// Manufacturer / Importer / Wholesale — dedicated warehouse & hierarchy system
export const ALL_NAV_ENTERPRISE = [
  ['dashboard', '🏠', 'Dashboard'],
  ['orders', '📄', 'Orders & LPO'],
  ['warehouses', '🏭', 'Warehouses & Branches'],
  ['stock', '📦', 'Stock & Batches'],
  ['staff', '👥', 'Sales Team'],
  ['territories', '🗺️', 'Territories'],
  ['messages', '✉️', 'Correspondence'],
  ['reports', '📊', 'Reports'],
  ['carefind', '🔍', 'CareFind Profile'],
  ['settings', '⚙️', 'Settings'],
]

export function getNavItems(role, businessType) {
  const perms = getPerms(role)
  let all = ALL_NAV_DEFAULT
  if (businessType === 'hospital') all = ALL_NAV_HOSPITAL
  if (businessType === 'manufacturer_importer' || businessType === 'wholesale') all = ALL_NAV_ENTERPRISE
  return all.filter(item => perms.nav.includes(item[0]))
}

export const ROLE_LIST = ['Owner', 'Manager', 'Pharmacist', 'Therapist', 'Receptionist', 'Cashier', 'Nurse', 'Doctor', 'Lab Technician']
