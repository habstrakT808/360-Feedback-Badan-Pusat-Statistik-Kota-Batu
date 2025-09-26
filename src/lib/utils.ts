// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for merging class names with Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Environment helpers
export const env = {
  // Optional overrides: comma-separated user IDs
  supervisorIdsOverride: process.env.NEXT_PUBLIC_SUPERVISOR_IDS || '',
  adminIdsOverride: process.env.NEXT_PUBLIC_ADMIN_IDS || '',
}

export function parseIdList(idList: string): string[] {
  return idList.split(',').map(id => id.trim()).filter(id => id.length > 0);
}