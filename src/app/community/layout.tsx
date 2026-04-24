import { AppHeader } from '@/components/AppHeader';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader active="comunidade" />
      {children}
    </div>
  );
}
