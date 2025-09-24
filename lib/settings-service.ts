// lib/settings-service.ts
import { prisma } from '@/lib/prisma'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: Date
  updated_at: Date
}

type ProfileUpdate = {
  full_name?: string
  avatar_url?: string
  updated_at?: Date
}

export interface UserSettings {
  profile: Profile
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email_reminders: boolean
    email_results: boolean
    email_announcements: boolean
    push_notifications: boolean
  }
}

export class SettingsService {
  // Get user profile
  static async getUserProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    })

    if (!profile) throw new Error('Profile not found')
    return profile
  }

  // Update user profile
  static async updateProfile(userId: string, updates: ProfileUpdate) {
    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...updates,
        updated_at: new Date()
      }
    })

    return profile
  }

  // Change password - handled by NextAuth
  static async changePassword(newPassword: string) {
    // This should be handled by NextAuth API route
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to change password')
    }
  }

  // Update email - handled by NextAuth
  static async updateEmail(newEmail: string) {
    // This should be handled by NextAuth API route
    const response = await fetch('/api/auth/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update email')
    }
  }

  // Upload avatar - simplified version without Supabase storage
  static async uploadAvatar(userId: string, file: File) {
    // For now, we'll just return a placeholder URL
    // In production, you would upload to a cloud storage service like AWS S3, Cloudinary, etc.
    const placeholderUrl = `https://via.placeholder.com/150/007bff/ffffff?text=${userId.charAt(0).toUpperCase()}`
    
    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: placeholderUrl })

    return placeholderUrl
  }

  // Get notification preferences (using localStorage for now)
  static getNotificationPreferences() {
    if (typeof window === 'undefined') return null
    
    const saved = localStorage.getItem('notification_preferences')
    return saved ? JSON.parse(saved) : {
      email_reminders: true,
      email_results: true,
      email_announcements: true,
      push_notifications: true
    }
  }

  // Save notification preferences
  static saveNotificationPreferences(preferences: UserSettings['notifications']) {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('notification_preferences', JSON.stringify(preferences))
  }

  // Get theme preference
  static getThemePreference(): 'light' | 'dark' | 'system' {
    if (typeof window === 'undefined') return 'system'
    
    return (localStorage.getItem('theme') as any) || 'system'
  }

  // Save theme preference
  static saveThemePreference(theme: 'light' | 'dark' | 'system') {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('theme', theme)
    
    // Apply theme
    const root = window.document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }
}