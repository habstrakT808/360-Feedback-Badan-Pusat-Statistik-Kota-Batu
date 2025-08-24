// lib/settings-service.ts
import { supabase } from '../src/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // Update user profile
  static async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Change password
  static async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  // Update email
  static async updateEmail(newEmail: string) {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) throw error
  }

  // Upload avatar
  static async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: publicUrl })

    return publicUrl
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