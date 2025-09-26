import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the current admin user
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const adminCheck = await prisma.userRole.findFirst({
      where: {
        user_id: session.user.id as string,
        role: 'admin'
      }
    });

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Check if any of the target users are admin (prevent admin from deleting admin)
    const targetUserRoles = await prisma.userRole.findMany({
      where: {
        user_id: { in: userIds },
        role: 'admin'
      },
      select: {
        user_id: true,
        role: true
      }
    });

    const adminUserIds = targetUserRoles
      .map((u: { user_id: string | null }) => u.user_id)
      .filter((id: string | null): id is string => typeof id === 'string' && id.length > 0);
    if (adminUserIds.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    const results = [];
    
    // Process each user deletion
    for (const userId of userIds) {
      try {
        // Delete related data first (due to foreign key constraints)
        
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

        results.push({ success: true, userId });
      } catch (error: any) {
        console.error(`Error deleting user ${userId}:`, error);
        results.push({ 
          success: false, 
          userId, 
          error: error.message || 'Unknown error' 
        });
      }
    }

    const successfulDeletions = results.filter(r => r.success).length;
    const failedDeletions = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed. ${successfulDeletions} users deleted successfully, ${failedDeletions} failed.`,
      results,
      summary: {
        total: userIds.length,
        successful: successfulDeletions,
        failed: failedDeletions
      }
    });

  } catch (error) {
    console.error('Error in bulk delete users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
