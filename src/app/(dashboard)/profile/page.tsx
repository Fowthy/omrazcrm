'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Music,
  Calendar,
  Loader2,
  Save,
  Upload,
  CheckSquare,
  FolderKanban,
} from 'lucide-react';
import { instruments, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserStats {
  projectsCount: number;
  songsCount: number;
  tasksCompleted: number;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    instrument: '',
    bio: '',
    phone: '',
  });

  // Initialize profile from session
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        instrument: session.user.instrument || '',
        bio: '',
        phone: '',
      });
      setAvatarUrl(session.user.avatar || '');
    }
  }, [session]);

  // Fetch user stats
  const { data: stats } = useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: async () => {
      const [projectsRes, songsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/songs'),
        fetch('/api/tasks'),
      ]);

      const projects = projectsRes.ok ? await projectsRes.json() : [];
      const songs = songsRes.ok ? await songsRes.json() : [];
      const tasks = tasksRes.ok ? await tasksRes.json() : [];

      return {
        projectsCount: projects.length,
        songsCount: songs.length,
        tasksCompleted: tasks.filter((t: { status: string }) => t.status === 'done').length,
      };
    },
  });

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profile.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          email: data.email,
          instrument: data.instrument,
        },
      });

      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      setAvatarUrl(data.avatar);

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          avatar: data.avatar,
        },
      });

      toast.success('Avatar updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const user = session?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="mt-1 text-zinc-400">
          View and manage your personal information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-white">{user?.name}</h2>
              <p className="text-zinc-400">{user?.email}</p>

              {user?.instrument && (
                <Badge variant="secondary" className="mt-2 bg-violet-500/20 text-violet-400">
                  <Music className="mr-1 h-3 w-3" />
                  {user.instrument}
                </Badge>
              )}

              <Separator className="my-6" />

              {/* Stats */}
              <div className="grid w-full grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.projectsCount || 0}</div>
                  <div className="text-xs text-zinc-500">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.songsCount || 0}</div>
                  <div className="text-xs text-zinc-500">Songs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats?.tasksCompleted || 0}</div>
                  <div className="text-xs text-zinc-500">Tasks Done</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="mr-2 inline h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrument">
                  <Music className="mr-2 inline h-4 w-4" />
                  Instrument / Role
                </Label>
                <Select
                  value={profile.instrument}
                  onValueChange={(value) => setProfile({ ...profile, instrument: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="mr-2 inline h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 555-0123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>Your recent activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
                <FolderKanban className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.projectsCount || 0}</div>
                <div className="text-sm text-zinc-400">Active Projects</div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                <Music className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.songsCount || 0}</div>
                <div className="text-sm text-zinc-400">Songs Created</div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                <CheckSquare className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.tasksCompleted || 0}</div>
                <div className="text-sm text-zinc-400">Tasks Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
