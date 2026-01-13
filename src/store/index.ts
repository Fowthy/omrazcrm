import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'omraz-theme',
    }
  )
);

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  toggleMobileOpen: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setMobileOpen: (open) => set({ isMobileOpen: open }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
    }),
    {
      name: 'omraz-sidebar',
    }
  )
);

interface AudioPlayerState {
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
  } | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playbackRate: number;
  loop: {
    enabled: boolean;
    start: number;
    end: number;
  };
  compareTrack: {
    id: string;
    title: string;
    url: string;
  } | null;
  setCurrentTrack: (track: AudioPlayerState['currentTrack']) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setLoop: (loop: AudioPlayerState['loop']) => void;
  setCompareTrack: (track: AudioPlayerState['compareTrack']) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  playbackRate: 1,
  loop: {
    enabled: false,
    start: 0,
    end: 0,
  },
  compareTrack: null,
  setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0 }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setLoop: (loop) => set({ loop }),
  setCompareTrack: (track) => set({ compareTrack: track }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));

interface CommandPaletteState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}));

interface ActiveProject {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface ProjectState {
  activeProject: ActiveProject | null;
  setActiveProject: (project: ActiveProject | null) => void;
  clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProject: null,
      setActiveProject: (project) => set({ activeProject: project }),
      clearActiveProject: () => set({ activeProject: null }),
    }),
    {
      name: 'omraz-active-project',
    }
  )
);
