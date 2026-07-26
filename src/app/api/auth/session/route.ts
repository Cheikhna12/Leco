import { authJson, toAuthErrorResponse } from "@/features/auth/server/response";
import { getServerSession } from "@/lib/supabase/session";

export async function GET() {
  try {
    const session = await getServerSession();

    return authJson(
      session
        ? {
            authenticated: true,
            session: {
              userId: session.userId,
              role: session.role,
              assuranceLevel: session.assuranceLevel,
              accountState: session.accountState,
              profileState: session.profileState,
              expiresAt: session.expiresAt?.toISOString() ?? null,
            },
          }
        : { authenticated: false, session: null },
    );
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
