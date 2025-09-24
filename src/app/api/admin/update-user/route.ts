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

    // Resolve current user role by profile id via email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const role = prof ? await prisma.userRole.findFirst({ where: { user_id: prof.id } }) : null
    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, updates, newEmail, newPassword } = await request.json();

    // Resolve target profile id from provided userId, which may be either Profile.id or User.id
    let targetProfileId: string | null = null
    const byProfile = await prisma.profile.findUnique({ where: { id: userId } })
    if (byProfile?.id) {
      targetProfileId = byProfile.id
    } else {
      const byUser = await prisma.user.findUnique({ where: { id: userId } })
      if (byUser?.email) {
        const profByEmail = await prisma.profile.findUnique({ where: { email: byUser.email } })
        if (profByEmail?.id) targetProfileId = profByEmail.id
      }
    }

    // Update user profile if provided
    if (updates && targetProfileId) {
      await prisma.profile.update({
        where: { id: targetProfileId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });
    }

    // Update email if provided
    if (newEmail) {
      await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail }
      });

      // Also update the profiles table email field
      if (targetProfileId) {
        await prisma.profile.update({
          where: { id: targetProfileId },
          data: { email: newEmail }
        });
      }
    }

    // Update password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash: hashedPassword }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User berhasil diperbarui' 
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui user' }, 
      { status: 500 }
    );
  }
}
