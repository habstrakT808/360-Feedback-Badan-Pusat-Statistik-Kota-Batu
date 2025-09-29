import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { newEmail } = await request.json();

    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Get current user email to update profile
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!currentUser?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update email in users table
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail }
    });

    // Also update the profiles table using current email
    await prisma.profile.updateMany({
      where: { email: currentUser.email },
      data: { email: newEmail }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email berhasil diperbarui' 
    });

  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui email' }, 
      { status: 500 }
    );
  }
}
