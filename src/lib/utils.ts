import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

export function getFileType(mimeType: string): string {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('midi')) return 'midi';
  if (mimeType.includes('reaper') || mimeType.includes('rpp')) return 'reaper';
  return 'other';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: 'bg-gray-500',
    writing: 'bg-blue-500',
    recording: 'bg-yellow-500',
    mixing: 'bg-orange-500',
    mastering: 'bg-purple-500',
    released: 'bg-green-500',
    archived: 'bg-gray-400',
    todo: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    review: 'bg-yellow-500',
    done: 'bg-green-500',
    pending: 'bg-gray-500',
    confirmed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  };
  return colors[priority] || 'text-gray-400';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const musicalKeys = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm',
];

export const timeSignatures = [
  '4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8',
];

export const projectStatuses = [
  { value: 'idea', label: 'Idea', color: 'gray' },
  { value: 'writing', label: 'Writing', color: 'blue' },
  { value: 'recording', label: 'Recording', color: 'yellow' },
  { value: 'mixing', label: 'Mixing', color: 'orange' },
  { value: 'mastering', label: 'Mastering', color: 'purple' },
  { value: 'released', label: 'Released', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'gray' },
];

export const projectTypes = [
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
  { value: 'demo', label: 'Demo' },
  { value: 'other', label: 'Other' },
];

export const taskStatuses = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export const taskPriorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const expenseCategories = [
  { value: 'gear', label: 'Gear' },
  { value: 'studio', label: 'Studio' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'travel', label: 'Travel' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

export const gearCategories = [
  { value: 'guitar', label: 'Guitar' },
  { value: 'bass', label: 'Bass' },
  { value: 'drums', label: 'Drums' },
  { value: 'keys', label: 'Keys/Synths' },
  { value: 'pedals', label: 'Pedals/Effects' },
  { value: 'amps', label: 'Amplifiers' },
  { value: 'microphones', label: 'Microphones' },
  { value: 'cables', label: 'Cables' },
  { value: 'recording', label: 'Recording' },
  { value: 'other', label: 'Other' },
];

export const contactTypes = [
  { value: 'venue', label: 'Venue' },
  { value: 'studio', label: 'Studio' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'manager', label: 'Manager' },
  { value: 'label', label: 'Label' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'press', label: 'Press/Media' },
  { value: 'other', label: 'Other' },
];

export const userRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Band Member' },
  { value: 'guest', label: 'Guest' },
];

export const instruments = [
  'Vocals',
  'Lead Guitar',
  'Rhythm Guitar',
  'Bass',
  'Drums',
  'Keys/Piano',
  'Synth',
  'Percussion',
  'Violin',
  'Cello',
  'Saxophone',
  'Trumpet',
  'Other',
];
