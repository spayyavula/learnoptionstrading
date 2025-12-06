import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, queryOne } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';
import {
  verifyPassword,
  generateTokens,
  isValidEmail,
  AuthenticatedUser
} from '../../lib/auth';

interface LoginRequest {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
}

interface ProfileRow {
  display_name: string | null;
  full_name: string | null;
}

interface RoleRow {
  role_key: string;
}

export async function login(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400);
    }

    if (!password) {
      return jsonResponse({ error: 'Password is required' }, 400);
    }

    // Find user by email
    const user = await queryOne<UserRow>(
      'SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (!user) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    // Check if user has password (might be OAuth-only user)
    if (!user.password_hash) {
      return jsonResponse({ error: 'Please use social login for this account' }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

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

    // Generate tokens
    const displayName = profile?.display_name || profile?.full_name || email.split('@')[0];
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
    context.error('Error logging in:', error);
    return handleError(error);
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
