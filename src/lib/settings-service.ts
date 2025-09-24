// src/lib/settings-service.ts
// Client-side service must not use Prisma directly

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  position: string | null;
  department: string | null;
  allow_public_view: boolean | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export class SettingsService {
  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const res = await fetch(`/api/team/user/${encodeURIComponent(userId)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch user profile')
    const json = await res.json()
    if (!json?.profile) throw new Error('Profile not found')
    return json.profile as UserProfile
  }

  // Upload avatar and update profile.avatar_url
  static async uploadAvatar(userId: string, file: File): Promise<UserProfile> {
    try {
      // For now, return a placeholder URL
      // TODO: Implement actual file upload to your preferred storage service
      const avatarUrl = `https://via.placeholder.com/150/007bff/ffffff?text=${userId.charAt(0).toUpperCase()}`

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
    // Send to server API to avoid Prisma in browser
    const res = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates })
    })
    if (!res.ok) throw new Error('Failed to update user profile')
    const json = await res.json().catch(() => ({}))
    return (json.profile || json.user) as UserProfile
  }

  // Change password
  static async changePassword(newPassword: string): Promise<void> {
    try {
      // Call API endpoint to change password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('Failed to change password');
    }
  }

  // Update email without confirmation
  static async updateEmail(newEmail: string): Promise<void> {
    try {
      // Call API endpoint to update email
      const response = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      throw new Error('Failed to update email');
    }
  }

  // Update email directly using API endpoint (bypasses confirmation)
  static async updateEmailDirectly(userId: string, newEmail: string): Promise<void> {
    try {
      // Call API endpoint to update email
      const response = await fetch('/api/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
