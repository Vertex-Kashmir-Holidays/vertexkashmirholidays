import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Already signed in? Don't show the login form again — send them to where
  // they belong (staff → admin, customers → their account).
  const session = await auth();
  if (session?.user) {
    redirect(isStaff(session.user.role) ? '/admin/dashboard' : '/account');
  }

  return <AuthScreen />;
}
