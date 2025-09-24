import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve current user's profile.id via email, then check role by profile id
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email } });
    const isAdmin = prof
      ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: 'admin' } })
      : null;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, email } = await request.json();

    // Resolve target user
    let targetUser: { id: string } | null = null;
    let resolvedEmail: string | null = null;
    if (email) {
      resolvedEmail = email;
      targetUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    }
    if (!targetUser && userId) {
      // try as user.id first
      targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!targetUser) {
        // maybe body carried profile.id; resolve profile -> email -> user
        const prof2 = await prisma.profile.findUnique({ where: { id: userId } });
        if (prof2?.email) {
          resolvedEmail = prof2.email;
          targetUser = await prisma.user.findUnique({ where: { email: prof2.email }, select: { id: true } });
        }
      }
    }
    // Hash the new password (do once; may be used for create or update)
    const hashedPassword = await bcrypt.hash('12345678', 12);

    // If user still not found but we have an email, create or upsert the User
    if (!targetUser && resolvedEmail) {
      const upserted = await prisma.user.upsert({
        where: { email: resolvedEmail },
        update: { password_hash: hashedPassword },
        create: { email: resolvedEmail, password_hash: hashedPassword },
        select: { id: true },
      });
      return NextResponse.json({ 
        success: true,
        message: 'Password di-set untuk akun baru (atau diperbarui) ke 12345678',
        userId: upserted.id,
      });
    }
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user password in database
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { password_hash: hashedPassword }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password berhasil direset ke 12345678' 
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Gagal reset password' }, 
      { status: 500 }
    );
  }
}
