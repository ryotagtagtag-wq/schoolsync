import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function NewAssignmentPage() {
  const session = await auth();
  if (session) {
    redirect('/play');
  }
  redirect('/login');
}
