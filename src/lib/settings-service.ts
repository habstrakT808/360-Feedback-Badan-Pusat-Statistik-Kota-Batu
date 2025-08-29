// src/lib/settings-service.ts
import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  position: string | null;
  department: string | null;
  allow_public_view: boolean | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export class SettingsService {
  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Upload avatar to Supabase Storage and update profile.avatar_url
  static async uploadAvatar(userId: string, file: File): Promise<UserProfile> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = publicUrlData.publicUrl

      // Update profile with new avatar URL
      const updated = await this.updateProfile(userId, { avatar_url: avatarUrl })
      return updated
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw new Error('Failed to upload avatar')
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Change password
  static async changePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  // Update email without confirmation
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating email:', error);
      throw new Error('Failed to update email');
    }
  }

  // Update email directly using API endpoint (bypasses confirmation)
  static async updateEmailDirectly(userId: string, newEmail: string): Promise<void> {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call API endpoint to update email
      const response = await fetch('/api/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ newEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update email');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email directly:', error);
      throw new Error('Failed to update email directly');
    }
  }

  // Theme is always light mode
  static getThemePreference(): "light" {
    return 'light';
  }

  // Set theme preference (always light)
  static setThemePreference(theme: "light"): void {
    if (typeof window === 'undefined') return;
    
    // Always apply light theme
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Get privacy settings
  static getPrivacySettings(): { allowPublicView: boolean } {
    if (typeof window === 'undefined') return { allowPublicView: false };
    
    const saved = localStorage.getItem('privacy-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { allowPublicView: false };
      }
    }
    return { allowPublicView: false };
  }

  // Set privacy settings
  static setPrivacySettings(settings: { allowPublicView: boolean }): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('privacy-settings', JSON.stringify(settings));
  }
}
