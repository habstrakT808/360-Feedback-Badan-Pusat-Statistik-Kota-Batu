import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the current admin user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve admin via profile id from email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const adminCheck = prof ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: 'admin' } }) : null
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin (prevent admin from deleting admin)
    const targetUserRole = await prisma.userRole.findFirst({
      where: {
        user_id: userId,
        role: 'admin'
      }
    });

    if (targetUserRole) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Start transaction-like operations
    // Delete related data first (due to foreign key constraints)
    
    try {
      // Delete assessment assignments where user is assessor or assessee
      await prisma.assessmentAssignment.deleteMany({
        where: {
          OR: [
            { assessor_id: userId },
            { assessee_id: userId }
          ]
        }
      });

      // Delete assessment history
      await prisma.assessmentHistory.deleteMany({
        where: { user_id: userId }
      });

      // Delete notification preferences
      await prisma.notificationPreference.deleteMany({
        where: { user_id: userId }
      });

      // Delete notifications
      await prisma.notification.deleteMany({
        where: { user_id: userId }
      });

      // Delete reminder logs
      await prisma.reminderLog.deleteMany({
        where: { user_id: userId }
      });

      // Delete employee pins where user is giver or receiver
      await prisma.employeePin.deleteMany({
        where: {
          OR: [
            { giver_id: userId },
            { receiver_id: userId }
          ]
        }
      });

      // Delete weekly pin allowance
      await prisma.weeklyPinAllowance.deleteMany({
        where: { user_id: userId }
      });

      // Delete monthly pin allowance
      await prisma.monthlyPinAllowance.deleteMany({
        where: { user_id: userId }
      });

      // Delete user role
      await prisma.userRole.deleteMany({
        where: { user_id: userId }
      });

      // Finally, delete the user profile
      await prisma.profile.delete({
        where: { id: userId }
      });

    } catch (dbError) {
      console.error('Error deleting user data:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId
    });

  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
