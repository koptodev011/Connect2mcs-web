import type { Metadata } from 'next';
import RoleDashboard from '@/components/role-dashboard/RoleDashboard';

export const metadata: Metadata = { title: 'Student Dashboard · Connect2MCS' };

export default function StudentDashboardPage() {
  return <RoleDashboard kind="student" />;
}
