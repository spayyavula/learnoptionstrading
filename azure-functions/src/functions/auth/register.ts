import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, queryOne, transaction } from '../../lib/database';
import { jsonResponse, handleError } from '../../lib/response';
import {
  hashPassword,
  generateTokens,
  isValidEmail,
  isValidPassword,
  AuthenticatedUser
} from '../../lib/auth';

interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

interface UserRow {
  id: string;
  email: string;
}

interface ProfileRow {
  display_name: string | null;
}

interface RoleRow {
  role_key: string;
}

export async function register(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as RegisterRequest;
    const { email, password, displayName } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email address' }, 400);
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return jsonResponse({ error: passwordValidation.message }, 400);
    }

    // Check if email already exists
    const existingUser = await queryOne<UserRow>(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser) {
      return jsonResponse({ error: 'Email already registered' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with transaction
    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, email_verified)
         VALUES ($1, $2, false)
         RETURNING id, email`,
        [email.toLowerCase(), passwordHash]
      );
      const user = userResult.rows[0] as UserRow;

      // Create profile
      await client.query(
        `INSERT INTO user_profiles (user_id, display_name, full_name)
         VALUES ($1, $2, $2)`,
        [user.id, displayName || email.split('@')[0]]
      );

      // Create default paper trading account
      await client.query(
        `INSERT INTO paper_trading_accounts (user_id, account_name, account_description, is_default)
         VALUES ($1, 'My Paper Account', 'Default paper trading account with $100,000', true)`,
        [user.id]
      );

      // Assign free role
      await client.query(
        `INSERT INTO user_role_assignments (user_id, role_id)
         SELECT $1, id FROM user_roles WHERE role_key = 'free'`,
        [user.id]
      );

      return user;
    });

    // Get user roles
    const roles = await query<RoleRow>(
      `SELECT r.role_key
       FROM user_role_assignments ura
       JOIN user_roles r ON r.id = ura.role_id
       WHERE ura.user_id = $1 AND ura.is_active = true`,
      [result.id]
    );

    // Generate tokens
    const authenticatedUser: AuthenticatedUser = {
      userId: result.id,
      email: result.email,
      displayName: displayName || email.split('@')[0],
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
    }, 201);

  } catch (error) {
    context.error('Error registering user:', error);
    return handleError(error);
  }
}

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register,
});
