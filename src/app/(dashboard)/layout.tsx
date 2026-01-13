'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';
import { OnboardingOverlay, FirstProjectPrompt, WelcomeDialog } from '@/components/onboarding';
import { useSidebarStore } from '@/store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isCollapsed } = useSidebarStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          backgroundImage: 'url("/10A44171-E977-4C91-B2B5-62205CEAC7C2 (2) (1).jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="fixed inset-0 bg-black/60" />
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 relative z-10" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url("/10A44171-E977-4C91-B2B5-62205CEAC7C2 (2) (1).jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-black/80 pointer-events-none" />

      <Sidebar />
      <Header />
      <CommandPalette />

      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300 relative z-10',
          // Desktop: offset by sidebar width
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64',
          // Mobile: no padding (sidebar is overlay)
          'pl-0'
        )}
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>

      {/* Onboarding Components */}
      <WelcomeDialog />
      <OnboardingOverlay />
      <FirstProjectPrompt />
    </div>
  );
}
