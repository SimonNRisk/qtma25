import { useRouter } from 'next/navigation';
import { session } from '@/lib/session';

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const getUserName = (user: User | null) => {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user?.first_name) {
    return user.first_name;
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }

  // Note: session.getUser() is now async and requires API call
  // For synchronous fallback, just return 'User'
  return 'User';
};

export const handlePostClick = (
  { content }: { content: string },
  router: ReturnType<typeof useRouter>
) => {
  router.push(`/create/edit?text=${encodeURIComponent(content)}`);
};
