import { Avatar } from '../ui'
import { useAuth } from '../../App'
import { TEAL } from '../../lib/utils'

export default function TopBar({ title, brand, role }) {
  const { auth } = useAuth()
  const userName = auth?.staff ? auth.staff.full_name : (brand?.owner || 'Owner')

  return (
    <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {role && role !== 'Owner' && (
          <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#f0fdfa', color: '#0f766e', fontSize: '11px', fontWeight: '700' }}>
            {role}
          </span>
        )}
        <Avatar name={userName} size={34} />
      </div>
    </div>
  )
}
