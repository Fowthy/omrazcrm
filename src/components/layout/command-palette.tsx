'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPaletteStore } from '@/store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
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
  Mic2,
  Plus,
  Search,
  Package,
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Go to Projects', icon: FolderKanban },
  { href: '/songs', label: 'Go to Songs', icon: Music },
  { href: '/setlists', label: 'Go to Setlists', icon: ListMusic },
  { href: '/shows', label: 'Go to Shows', icon: Mic2 },
  { href: '/rehearsals', label: 'Go to Rehearsals', icon: CalendarDays },
  { href: '/tasks', label: 'Go to Tasks', icon: CheckSquare },
  { href: '/finances', label: 'Go to Finances', icon: Wallet },
  { href: '/gear', label: 'Go to Gear', icon: Guitar },
  { href: '/merch', label: 'Go to Merch', icon: Package },
  { href: '/inspiration', label: 'Go to Inspiration', icon: Lightbulb },
  { href: '/contacts', label: 'Go to Contacts', icon: Users },
  { href: '/settings', label: 'Go to Settings', icon: Settings },
];

const quickActions = [
  { href: '/projects/new', label: 'Create New Project', icon: Plus },
  { href: '/songs/new', label: 'Create New Song', icon: Plus },
  { href: '/tasks/new', label: 'Create New Task', icon: Plus },
  { href: '/setlists/new', label: 'Create New Setlist', icon: Plus },
  { href: '/rehearsals/new', label: 'Schedule Rehearsal', icon: Plus },
];

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, setOpen, toggle } = useCommandPaletteStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/search?type=songs'))
            }
          >
            <Search className="mr-2 h-4 w-4" />
            Search Songs
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/search?type=projects'))
            }
          >
            <Search className="mr-2 h-4 w-4" />
            Search Projects
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/search?type=files'))
            }
          >
            <Search className="mr-2 h-4 w-4" />
            Search Files
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
