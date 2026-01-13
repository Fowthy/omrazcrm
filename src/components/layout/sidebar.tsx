'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store';
import {
  LayoutDashboard,
  Music,
  FolderKanban,
  ListMusic,
  CalendarDays,
  CheckSquare,
  Wallet,
  Guitar,
  Lightbulb,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mic2,
  Calendar,
  Share2,
  Package,
  LogOut,
  Book,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { signOut } from 'next-auth/react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/songs', label: 'Songs', icon: Music },
  { href: '/setlists', label: 'Setlists', icon: ListMusic },
  { href: '/shows', label: 'Shows', icon: Mic2 },
];

const workNavItems = [
  { href: '/rehearsals', label: 'Rehearsals', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

const resourcesNavItems = [
  { href: '/finances', label: 'Finances', icon: Wallet },
  { href: '/gear', label: 'Gear', icon: Guitar },
  { href: '/merch', label: 'Merch', icon: Package },
  { href: '/inspiration', label: 'Inspiration', icon: Lightbulb },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/shares', label: 'Shared Links', icon: Share2 },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isCollapsed: boolean;
}

function NavItem({ href, label, icon: Icon, isCollapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-violet-600/20 text-violet-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  return (
    <TooltipProvider>
      <aside
        data-onboarding="sidebar"
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-16 items-center border-b border-zinc-800 px-4', isCollapsed && 'justify-center px-2')}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
              <Image
                src="/White over trans.png"
                alt="Omraz"
                fill
                className="object-cover"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="relative h-8 w-24">
                <Image
                  src="/White over trans.png"
                  alt="Omraz"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
            ))}

            <Separator className="my-4" />

            {!isCollapsed && (
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Work
              </span>
            )}
            {workNavItems.map((item) => (
              <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
            ))}

            <Separator className="my-4" />

            {!isCollapsed && (
              <span className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Resources
              </span>
            )}
            {resourcesNavItems.map((item) => (
              <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-2">
          <NavItem href="/docs" label="Documentation" icon={Book} isCollapsed={isCollapsed} />
          <NavItem href="/settings" label="Settings" icon={Settings} isCollapsed={isCollapsed} />

          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-zinc-700 bg-zinc-900"
          onClick={toggleCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
