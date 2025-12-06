import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, queryOne } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';
import { requireAuth } from '../../lib/auth';

interface ProfileRow {
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  trading_experience: string | null;
  risk_tolerance: string | null;
  onboarding_completed: boolean;
}

interface RoleRow {
  role_key: string;
  role_name: string;
}

interface SubscriptionRow {
  plan_type: string;
  status: string;
  current_period_end: string | null;
}

export async function me(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = requireAuth(request);

    // Get user profile
    const profile = await queryOne<ProfileRow>(
      `SELECT display_name, full_name, avatar_url, trading_experience,
              risk_tolerance, onboarding_completed
       FROM user_profiles WHERE user_id = $1`,
      [user.userId]
    );

    // Get user roles
    const roles = await query<RoleRow>(
      `SELECT r.role_key, r.role_name
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`,
      [user.userId]
    );

    // Get subscription
    const subscription = await queryOne<SubscriptionRow>(
      `SELECT plan_type, status, current_period_end
       FROM subscriptions WHERE user_id = $1`,
      [user.userId]
    );

    return jsonResponse({
      id: user.userId,
      email: user.email,
      displayName: profile?.display_name || profile?.full_name || user.email.split('@')[0],
      avatarUrl: profile?.avatar_url,
      tradingExperience: profile?.trading_experience,
      riskTolerance: profile?.risk_tolerance,
      onboardingCompleted: profile?.onboarding_completed ?? false,
      roles: roles.map(r => ({
        key: r.role_key,
        name: r.role_name,
      })),
      subscription: subscription ? {
        plan: subscription.plan_type,
        status: subscription.status,
        expiresAt: subscription.current_period_end,
      } : {
        plan: 'free',
        status: 'active',
        expiresAt: null,
      },
    });

  } catch (error) {
    context.error('Error fetching user:', error);
    return handleError(error);
  }
}

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: me,
});
