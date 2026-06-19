
import LiveViewerDashboard from './LiveViewerDashboard';
import { headers } from 'next/headers';

export default function LivePage() {
  const heads = headers();
  const userId = heads.get('x-user-id');
  const userEmail = heads.get('x-user-email');
  const user = userId && userEmail ? { id: userId, email: userEmail } : null;

  return <LiveViewerDashboard user={user} />;
}
