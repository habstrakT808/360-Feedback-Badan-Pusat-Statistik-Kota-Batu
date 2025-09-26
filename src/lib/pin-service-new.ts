// src/lib/pin-service.ts
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

type Profile = {
  id: string
  email: string
  username: string
  full_name: string
  position: string | null
  department: string | null
  avatar_url: string | null
  allow_public_view: boolean
  created_at: Date
  updated_at: Date
}

export interface PinRanking {
  user_id: string
  full_name: string
  avatar_url?: string
  pin_count: number
  rank: number
}

export interface MonthlyPinAllowance {
  user_id: string
  pins_remaining: number
  pins_used: number
  month?: number
  year?: number
  last_reset_at?: string
}

export class PinService {
  // Helper function untuk memastikan konsistensi week number
  private static getConsistentWeekNumber(): { weekNumber: number; year: number; month: number } {
    const weekNumber = this.getCurrentWeekNumber()
    const year = this.getCurrentYear()
    const month = this.getCurrentMonth()
    
    console.log('🔍 Consistent Week Number:', { weekNumber, year, month })
    
    return { weekNumber, year, month }
  }

  // Mendapatkan nomor minggu saat ini
  static getCurrentWeekNumber(): number {
    const now = new Date()
    
    // Gunakan formula yang sama dengan PostgreSQL DATE_PART('week', date)
    // Ini adalah pendekatan sederhana yang konsisten
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
    const startDay = startOfYear.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust for PostgreSQL week calculation (Monday = start of week)
    const adjustedStartDay = startDay === 0 ? 7 : startDay // Convert Sunday (0) to 7
    const weekNumber = Math.ceil((dayOfYear + adjustedStartDay - 2) / 7)
    
    return Math.max(1, weekNumber) // Ensure minimum week 1
  }

  // Mendapatkan tahun saat ini
  static getCurrentYear(): number {
    return new Date().getFullYear()
  }

  // Mendapatkan bulan saat ini
  static getCurrentMonth(): number {
    return new Date().getMonth() + 1
  }

  // Mendapatkan data pin untuk ranking
  static async getPinRankings(limit: number = 10): Promise<PinRanking[]> {
    try {
      // Get admin user IDs to exclude them
      const { adminIds } = await RolesService.getRoleUserIds()

      // Get pin counts grouped by receiver
      const pinCounts = await prisma.employeePin.groupBy({
        by: ['receiver_id'],
        where: {
          receiver_id: {
            notIn: adminIds
          }
        },
        _count: {
          receiver_id: true
        }
      })

      // Get user details for each receiver
      const userIds = pinCounts.map((p: { receiver_id: string | null; _count: { receiver_id: number } }) => p.receiver_id).filter((id: string | null): id is string => !!id)
      const users = await prisma.profile.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          full_name: true,
          avatar_url: true
        }
      })

      // Create user map for quick lookup
      const userMap = new Map(users.map((user: { id: string; full_name: string; avatar_url: string | null }) => [user.id, user]))

      // Create rankings
      const rankings = pinCounts
        .map((pinCount: { receiver_id: string | null; _count: { receiver_id: number } }, index: number) => {
          const user = userMap.get(pinCount.receiver_id || '') as { id: string; full_name: string; avatar_url: string | null } | undefined
          if (!user) return null

          return {
            user_id: pinCount.receiver_id!,
            full_name: user.full_name,
            avatar_url: user.avatar_url || undefined,
            pin_count: pinCount._count.receiver_id,
            rank: index + 1
          }
        })
        .filter((ranking: any) => ranking !== null)
        .sort((a: any, b: any) => b.pin_count - a.pin_count)
        .slice(0, limit) as PinRanking[]

      // Update ranks after sorting
      rankings.forEach((ranking: any, index: number) => {
        ranking.rank = index + 1
      })

      return rankings
    } catch (error) {
      console.error('Error fetching pin rankings:', error)
      return []
    }
  }

  // Mendapatkan data pin untuk user tertentu
  static async getUserPinHistory(userId: string, limit: number = 20) {
    try {
      const pins = await prisma.employeePin.findMany({
        where: {
          OR: [
            { giver_id: userId },
            { receiver_id: userId }
          ]
        },
        include: {
          giver: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true
            }
          },
          receiver: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true
            }
          }
        },
        orderBy: { given_at: 'desc' },
        take: limit
      })

      return pins
    } catch (error) {
      console.error('Error fetching user pin history:', error)
      return []
    }
  }

  // Memberikan pin kepada user lain
  static async givePin(giverId: string, receiverId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { weekNumber, year, month } = this.getConsistentWeekNumber()

      // Check if giver has remaining pins for this week
      const allowance = await this.getWeeklyPinAllowance(giverId, weekNumber, year)
      if (allowance.pins_remaining <= 0) {
        return {
          success: false,
          message: 'Anda sudah menggunakan semua pin minggu ini'
        }
      }

      // Check if giver has already given pin to this receiver this week
      const existingPin = await prisma.employeePin.findFirst({
        where: {
          giver_id: giverId,
          receiver_id: receiverId,
          week_number: weekNumber,
          year: year
        }
      })

      if (existingPin) {
        return {
          success: false,
          message: 'Anda sudah memberikan pin kepada user ini minggu ini'
        }
      }

      // Create the pin
      await prisma.employeePin.create({
        data: {
          giver_id: giverId,
          receiver_id: receiverId,
          week_number: weekNumber,
          year: year,
          month: month
        }
      })

      // Update allowance
      await this.updateWeeklyPinAllowance(giverId, weekNumber, year, 1)

      return {
        success: true,
        message: 'Pin berhasil diberikan!'
      }
    } catch (error) {
      console.error('Error giving pin:', error)
      return {
        success: false,
        message: 'Terjadi kesalahan saat memberikan pin'
      }
    }
  }

  // Mendapatkan weekly pin allowance
  static async getWeeklyPinAllowance(userId: string, weekNumber: number, year: number): Promise<MonthlyPinAllowance> {
    try {
      let allowance = await prisma.weeklyPinAllowance.findUnique({
        where: {
          weekly_pin_allowance_user_week_year_key: {
            user_id: userId,
            week_number: weekNumber,
            year: year
          }
        }
      })

      if (!allowance) {
        // Create new allowance if doesn't exist
        allowance = await prisma.weeklyPinAllowance.create({
          data: {
            user_id: userId,
            week_number: weekNumber,
            year: year,
            pins_remaining: 4,
            pins_used: 0
          }
        })
      }

      return {
        user_id: allowance.user_id!,
        pins_remaining: allowance.pins_remaining,
        pins_used: allowance.pins_used,
        month: this.getCurrentMonth(),
        year: year,
        last_reset_at: allowance.created_at.toISOString()
      }
    } catch (error) {
      console.error('Error getting weekly pin allowance:', error)
      return {
        user_id: userId,
        pins_remaining: 4,
        pins_used: 0,
        month: this.getCurrentMonth(),
        year: year
      }
    }
  }

  // Update weekly pin allowance
  private static async updateWeeklyPinAllowance(userId: string, weekNumber: number, year: number, pinsUsed: number) {
    try {
      await prisma.weeklyPinAllowance.upsert({
        where: {
          weekly_pin_allowance_user_week_year_key: {
            user_id: userId,
            week_number: weekNumber,
            year: year
          }
        },
        update: {
          pins_used: {
            increment: pinsUsed
          },
          pins_remaining: {
            decrement: pinsUsed
          }
        },
        create: {
          user_id: userId,
          week_number: weekNumber,
          year: year,
          pins_remaining: 4 - pinsUsed,
          pins_used: pinsUsed
        }
      })
    } catch (error) {
      console.error('Error updating weekly pin allowance:', error)
    }
  }

  // Mendapatkan total pin yang diterima user
  static async getUserTotalPins(userId: string): Promise<number> {
    try {
      const count = await prisma.employeePin.count({
        where: { receiver_id: userId }
      })
      return count
    } catch (error) {
      console.error('Error getting user total pins:', error)
      return 0
    }
  }

  // Mendapatkan pin yang diberikan user
  static async getUserGivenPins(userId: string): Promise<number> {
    try {
      const count = await prisma.employeePin.count({
        where: { giver_id: userId }
      })
      return count
    } catch (error) {
      console.error('Error getting user given pins:', error)
      return 0
    }
  }

  // Mendapatkan pin yang diterima user
  static async getUserReceivedPins(userId: string): Promise<number> {
    try {
      const count = await prisma.employeePin.count({
        where: { receiver_id: userId }
      })
      return count
    } catch (error) {
      console.error('Error getting user received pins:', error)
      return 0
    }
  }

  // Mendapatkan pin statistics untuk dashboard
  static async getPinStatistics() {
    try {
      const totalPins = await prisma.employeePin.count()
      const thisWeekPins = await prisma.employeePin.count({
        where: {
          week_number: this.getCurrentWeekNumber(),
          year: this.getCurrentYear()
        }
      })
      const thisMonthPins = await prisma.employeePin.count({
        where: {
          month: this.getCurrentMonth(),
          year: this.getCurrentYear()
        }
      })

      return {
        totalPins,
        thisWeekPins,
        thisMonthPins
      }
    } catch (error) {
      console.error('Error getting pin statistics:', error)
      return {
        totalPins: 0,
        thisWeekPins: 0,
        thisMonthPins: 0
      }
    }
  }
}
