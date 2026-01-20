'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  Wallet,
  Guitar,
  Lightbulb,
  Users,
  Settings,
  Mic2,
  Plus,
  Timer,
  GitBranch,
  MessageSquare,
  Activity,
  Calendar,
  Palette,
  Sparkles,
  Wrench,
  Piano,
  AudioLines,
  ImageIcon,
  Package,
  Share2,
  Book,
  FileAudio,
  FileClock,
  FileText,
} from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';

const navigationItems = [
  { href: '/dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Go to Albums', icon: FolderKanban },
  { href: '/songs', label: 'Go to Songs', icon: Music },
  { href: '/decisions', label: 'Go to Decisions', icon: GitBranch },
  { href: '/sessions', label: 'Go to Sessions', icon: CalendarDays },
  { href: '/notes', label: 'Go to Notes', icon: MessageSquare },
  { href: '/timeline', label: 'Go to Timeline', icon: Activity },
  { href: '/style-parameters', label: 'Go to Style Parameters', icon: Palette },
  { href: '/calendar', label: 'Go to Calendar', icon: Calendar },
  { href: '/setlists', label: 'Go to Setlists', icon: ListMusic },
  { href: '/shows', label: 'Go to Shows', icon: Mic2 },
  { href: '/tempo-maps', label: 'Go to Tempo Maps', icon: Timer },
  { href: '/visualizations', label: 'Go to Visualizations', icon: Sparkles },
  { href: '/tools', label: 'Go to Tools', icon: Wrench },
  { href: '/midi-builder', label: 'Go to MIDI Builder', icon: Piano },
  { href: '/samples', label: 'Go to Sample Library', icon: AudioLines },
  { href: '/media', label: 'Go to Media', icon: ImageIcon },
  { href: '/finances', label: 'Go to Finances', icon: Wallet },
  { href: '/gear', label: 'Go to Gear', icon: Guitar },
  { href: '/merch', label: 'Go to Merch', icon: Package },
  { href: '/inspiration', label: 'Go to Inspiration', icon: Lightbulb },
  { href: '/contacts', label: 'Go to Contacts', icon: Users },
  { href: '/shares', label: 'Go to Shared Links', icon: Share2 },
  { href: '/docs', label: 'Go to Documentation', icon: Book },
  { href: '/settings', label: 'Go to Settings', icon: Settings },
];

const quickActions = [
  { action: 'new-album', label: 'Create New Album', icon: Plus, href: '/projects' },
  { action: 'new-song', label: 'Create New Song', icon: Plus, href: '/songs' },
  { action: 'new-decision', label: 'Create New Decision', icon: Plus, href: '/decisions' },
  { action: 'new-session', label: 'Start New Session', icon: Plus, href: '/sessions' },
  { action: 'new-note', label: 'Create New Note', icon: Plus, href: '/notes' },
  { action: 'new-setlist', label: 'Create New Setlist', icon: Plus, href: '/setlists' },
];

interface SearchResult {
  id: string;
  type: 'album' | 'song' | 'decision' | 'session' | 'note';
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  url: string;
}

const typeIcons = {
  album: FolderKanban,
  song: Music,
  decision: GitBranch,
  session: CalendarDays,
  note: MessageSquare,
};

const typeColors = {
  album: 'text-violet-400',
  song: 'text-emerald-400',
  decision: 'text-amber-400',
  session: 'text-blue-400',
  note: 'text-pink-400',
};

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, setOpen, toggle } = useCommandPaletteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search API
  const { data: searchResults, isLoading: isSearching } = useQuery<{ results: SearchResult[] }>({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [] };
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`);
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: isOpen && debouncedQuery.length >= 2,
  });

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

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  // Filtered navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navigationItems;
    const lower = searchQuery.toLowerCase();
    return navigationItems.filter(
      (item) => item.label.toLowerCase().includes(lower) || item.href.toLowerCase().includes(lower)
    );
  }, [searchQuery]);

  // Filtered quick actions based on search
  const filteredActions = useMemo(() => {
    if (!searchQuery) return quickActions;
    const lower = searchQuery.toLowerCase();
    return quickActions.filter((item) => item.label.toLowerCase().includes(lower));
  }, [searchQuery]);

  const hasResults =
    (searchResults?.results?.length ?? 0) > 0 ||
    filteredNavItems.length > 0 ||
    filteredActions.length > 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search albums, songs, decisions, or type a command..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!hasResults && <CommandEmpty>No results found.</CommandEmpty>}

        {/* Search Results */}
        {searchResults?.results && searchResults.results.length > 0 && (
          <>
            <CommandGroup heading="Search Results">
              {searchResults.results.map((result) => {
                const Icon = typeIcons[result.type];
                const colorClass = typeColors[result.type];
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => runCommand(() => router.push(result.url))}
                    className="flex items-start gap-3"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{result.title}</span>
                        <span className="text-xs text-zinc-500 capitalize">{result.type}</span>
                      </div>
                      {result.subtitle && (
                        <span className="text-xs text-zinc-500 truncate block">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((item) => (
                <CommandItem
                  key={item.action}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  <item.icon className="mr-2 h-4 w-4 text-violet-400" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        {filteredNavItems.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNavItems.slice(0, searchQuery ? undefined : 8).map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Dedicated Search */}
        {searchQuery && searchQuery.length >= 2 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Advanced Search">
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/search?q=${encodeURIComponent(searchQuery)}`))
                }
              >
                <FileAudio className="mr-2 h-4 w-4 text-emerald-400" />
                Search all songs for "{searchQuery}"
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=decision`))
                }
              >
                <GitBranch className="mr-2 h-4 w-4 text-amber-400" />
                Search all decisions for "{searchQuery}"
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=note`))
                }
              >
                <FileText className="mr-2 h-4 w-4 text-pink-400" />
                Search all notes for "{searchQuery}"
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
