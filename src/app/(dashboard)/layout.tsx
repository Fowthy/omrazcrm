'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <img
          src="/background.jpg"
          alt=""
          className="fixed inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="fixed inset-0 bg-black/60" />
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 relative z-10" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Transparency */}
      <img
        src="/background.jpg"
        alt=""
        className="fixed inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
      />
      <div className="fixed inset-0 bg-black/70 pointer-events-none" />

      <Sidebar />
      <Header />
      <CommandPalette />

      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300 relative z-10',
          isCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Onboarding Components */}
      <WelcomeDialog />
      <OnboardingOverlay />
      <FirstProjectPrompt />
    </div>
  );
}
