export const ROLES = {
  Owner: {
    nav: ['dashboard','pos','inventory','clients','appointments','consultation','expenses','debts','purchases','staff','reports','settings','carefind','locations','reception','triage','doctor','rx_inbox','lab','imaging'],
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
    nav: ['dashboard','pos','inventory','clients','appointments','consultation','expenses','debts','purchases','reports','carefind'],
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

export function getPerms(role) {
  return ROLES[role] || ROLES['Cashier']
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

// Manufacturer / Importer — reuses existing working pages, relabelled.
// Warehouses/Sales Team screens will replace Locations/Staff once that module is built.
export const ALL_NAV_ENTERPRISE = [
  ['dashboard', '🏠', 'Dashboard'],
  ['locations', '🏭', 'Warehouses & Branches'],
  ['staff', '👥', 'Sales Team'],
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
