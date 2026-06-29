import LiveViewerDashboard from '../LiveViewerDashboard';
import { headers } from 'next/headers';

export default async function LivePlayerPage({ params }: { params: { playerId: string } }) {
  const heads = headers();
  const userId = heads.get('x-user-id');
  const userEmail = heads.get('x-user-email');
  const userRole = heads.get('x-user-role') || 'USER';
  const user = userId && userEmail ? { id: userId, email: userEmail } : null;

  return <LiveViewerDashboard user={user} playerId={params.playerId} userRole={userRole} />;
}
