import type { SavrUser } from './api';

export function homePathForUser(user: SavrUser | null) {
  if (!user) return '/';
  if (user.isStaff || user.isSuperuser) return '/platform';
  if (user.role === 'vendor') return '/marketplace';
  if (user.role === 'sponsor') return '/sponsor';
  return '/marketplace';
}
