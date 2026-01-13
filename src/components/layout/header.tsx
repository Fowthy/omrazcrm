'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useSidebarStore, useCommandPaletteStore, useNotificationStore, useThemeStore, useProjectStore } from '@/store';
import { cn, projectStatuses } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  User,
  Settings,
  LogOut,
  FolderKanban,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
}

export function Header() {
  const { data: session } = useSession();
  const { isCollapsed, toggleMobileOpen } = useSidebarStore();
  const { toggle: toggleCommandPalette } = useCommandPaletteStore();
  const { unreadCount } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const { activeProject, setActiveProject, clearActiveProject } = useProjectStore();

  // Fetch projects for selector
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const user = session?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500',
      writing: 'bg-blue-500',
      recording: 'bg-yellow-500',
      mixing: 'bg-orange-500',
      mastering: 'bg-purple-500',
      released: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm transition-all duration-300',
        // Desktop: offset by sidebar width
        isCollapsed ? 'lg:left-16' : 'lg:left-64',
        // Mobile: full width
        'left-0'
      )}
    >
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={toggleMobileOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Project Selector */}
      <div className="flex items-center gap-2 lg:gap-3 flex-1 lg:flex-none min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 min-w-0"
            >
              <FolderKanban className="h-4 w-4 text-violet-400 shrink-0" />
              {activeProject ? (
                <>
                  <span className="max-w-[80px] sm:max-w-[150px] truncate">{activeProject.name}</span>
                  <span className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(activeProject.status))} />
                </>
              ) : (
                <span className="text-zinc-400 hidden sm:inline">Select Project</span>
              )}
              <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Active Project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects && projects.length > 0 ? (
              <>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => setActiveProject(project)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', getStatusColor(project.status))} />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {activeProject?.id === project.id && (
                      <Check className="h-4 w-4 text-violet-400" />
                    )}
                  </DropdownMenuItem>
                ))}
                {activeProject && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clearActiveProject}
                      className="cursor-pointer text-zinc-400"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Selection
                    </DropdownMenuItem>
                  </>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-sm text-zinc-400">
                No projects yet
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/projects" className="cursor-pointer">
                View All Projects
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Project Badge - Hidden on mobile */}
        {activeProject && (
          <Link href={`/projects/${activeProject.id}`} className="hidden sm:block">
            <Badge
              variant="secondary"
              className="cursor-pointer bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
            >
              {projectStatuses.find(s => s.value === activeProject.status)?.label || activeProject.status}
            </Badge>
          </Link>
        )}
      </div>

      {/* Search */}
      <button
        onClick={toggleCommandPalette}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-2 sm:px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 shrink-0"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search everything...</span>
        <kbd className="hidden rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500 md:inline">
          ⌘K
        </kbd>
      </button>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-zinc-400">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-zinc-400">
                  {user?.email}
                </p>
                {user?.instrument && (
                  <p className="text-xs leading-none text-violet-400">
                    {user.instrument}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:text-red-400"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
