import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  position: z.string().optional(),
  department: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const prof = await prisma.profile.findUnique({ 
      where: { email: session.user.email as string } 
    })
    const role = prof ? await prisma.userRole.findFirst({ 
      where: { user_id: prof.id } 
    }) : null
    
    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Email sudah digunakan' 
      }, { status: 400 })
    }

    // Check if username already exists
    const existingUsername = await prisma.profile.findFirst({
      where: { username: validatedData.username }
    })
    
    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Username sudah digunakan' 
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user in auth table
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password_hash: hashedPassword,
      }
    })

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        id: user.id,
        email: validatedData.email,
        username: validatedData.username,
        full_name: validatedData.full_name,
        position: validatedData.position || null,
        department: validatedData.department || null,
        avatar_url: null,
        allow_public_view: false,
      }
    })

    // Create user role (default as 'user')
    await prisma.userRole.create({
      data: {
        user_id: profile.id,
        role: 'user',
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        position: profile.position,
        department: profile.department,
        created_at: profile.created_at,
      }
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: error.errors[0]?.message || 'Data tidak valid' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create user' 
    }, { status: 500 })
  }
}
