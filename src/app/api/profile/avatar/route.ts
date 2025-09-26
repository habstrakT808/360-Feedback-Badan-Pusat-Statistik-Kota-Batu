import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max file size is 5MB' }, { status: 400 })
    }

    const contentType = file.type || 'application/octet-stream'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await fs.promises.mkdir(uploadsDir, { recursive: true })

    const ext = contentType.split('/')[1] || 'png'
    const fileName = `${profile.id}-${crypto.randomBytes(6).toString('hex')}.${ext}`
    const filePath = path.join(uploadsDir, fileName)
    await fs.promises.writeFile(filePath, buffer)

    const publicUrl = `/uploads/avatars/${fileName}`

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: { avatar_url: publicUrl },
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}


