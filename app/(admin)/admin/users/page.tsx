import type { Metadata } from 'next';
import { UsersDirectory } from '@/components/users/admin/users-directory';

export const metadata: Metadata = { title: 'المستخدمون والصلاحيات' };

export default function AdminUsersPage() {
  return <UsersDirectory />;
}
