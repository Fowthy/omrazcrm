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
        <div className="fixed inset-0 z-0">
          <Image
            src="/background.png"
            alt=""
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 relative z-10" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background Image with Transparency */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/background.png"
          alt=""
          fill
          className="object-cover opacity-[0.08]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/70 via-zinc-950/85 to-zinc-950/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />
      </div>

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
