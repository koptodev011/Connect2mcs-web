import type { Metadata } from 'next';
import RoleDashboard from '@/components/role-dashboard/RoleDashboard';

export const metadata: Metadata = { title: 'Entrepreneur Dashboard · Connect2MCS' };

export default function EntrepreneurDashboardPage() {
  return <RoleDashboard kind="entrepreneur" />;
}
