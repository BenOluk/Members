import { AppHeader } from '@/components/AppHeader';
import { requireUser } from '@/core/application/session';

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader user={user} active="comunidade" />
      {children}
    </div>
  );
}
