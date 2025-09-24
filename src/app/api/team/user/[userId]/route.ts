import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
	request: Request,
	context: any
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userEmail = 'email' in session.user ? (session.user.email as string | undefined) : undefined;
		const sessionProfile = userEmail
			? await prisma.profile.findUnique({ where: { email: userEmail } })
			: null;

		// Allow self access or admins/supervisors; otherwise 403
		let isAdmin = false;
		let isSupervisor = false;
		if (sessionProfile) {
			const role = await prisma.userRole.findFirst({
				where: { user_id: sessionProfile.id },
			});
			isAdmin = role?.role === 'admin';
			isSupervisor = role?.role === 'supervisor';
		}

		const rawParams = context?.params;
		const resolvedParams = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams;
		const requestedUserId = (resolvedParams?.userId || context?.params?.userId) as string;

		// Resolve requested to profile first (supports Profile.id or User.id)
		let profile = await prisma.profile.findUnique({ where: { id: requestedUserId } });
		if (!profile) {
			const user = await prisma.user.findUnique({ where: { id: requestedUserId } });
			if (user?.email) {
				profile = await prisma.profile.findUnique({ where: { email: user.email } }) || null as any
			}
		}

		// Authorization after resolution: allow self, admin/supervisor, or public profile
		const isSelf = !!(sessionProfile?.id && profile?.id && sessionProfile.id === profile.id);
		const isPublic = !!profile?.allow_public_view;
		if (!isSelf && !isAdmin && !isSupervisor && !isPublic) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		if (!profile) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, profile });
	} catch (error) {
		console.error('GET /api/team/user/[userId] error', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}


