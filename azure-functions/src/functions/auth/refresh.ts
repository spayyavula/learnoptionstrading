import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, queryOne } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';
import {
  validateRefreshToken,
  generateTokens,
  AuthenticatedUser
} from '../../lib/auth';

interface RefreshRequest {
  refreshToken: string;
}

interface UserRow {
  id: string;
  email: string;
}

interface ProfileRow {
  display_name: string | null;
  full_name: string | null;
}

interface RoleRow {
  role_key: string;
}

export async function refresh(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as RefreshRequest;
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonResponse({ error: 'Refresh token is required' }, 400);
    }

    // Validate refresh token
    const userId = validateRefreshToken(refreshToken);
    if (!userId) {
      return jsonResponse({ error: 'Invalid or expired refresh token' }, 401);
    }

    // Get user
    const user = await queryOne<UserRow>(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 401);
    }

    // Get user profile
    const profile = await queryOne<ProfileRow>(
      'SELECT display_name, full_name FROM user_profiles WHERE user_id = $1',
      [user.id]
    );

    // Get user roles
    const roles = await query<RoleRow>(
      `SELECT r.role_key
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`,
      [user.id]
    );

    // Generate new tokens
    const displayName = profile?.display_name || profile?.full_name || user.email.split('@')[0];
    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      email: user.email,
      displayName,
      roles: roles.map(r => r.role_key),
    };

    const tokens = generateTokens(authenticatedUser);

    return jsonResponse({
      user: {
        id: authenticatedUser.userId,
        email: authenticatedUser.email,
        displayName: authenticatedUser.displayName,
      },
      ...tokens,
    });

  } catch (error) {
    context.error('Error refreshing token:', error);
    return handleError(error);
  }
}

app.http('refresh', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/refresh',
  handler: refresh,
});
