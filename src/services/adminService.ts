import { supabase } from '../lib/supabase';
import type { 
  AdminUser, 
  UserRole, 
  UserStatus, 
  AuditLogEntry, 
  SystemStats,
  AdminSettings
} from '../types/admin';

export class AdminService {
  /**
   * Get all users with their roles and status
   */
  static async getUsers(): Promise<AdminUser[]> {
    try {
      if (!supabase) {
        // Return mock data for development
        return this.getMockUsers();
      }
      
      // Fetch users from Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }
      
      // Fetch user roles and status from custom table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        throw rolesError;
      }
      
      // Fetch subscription data
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subError) {
        throw subError;
      }
      
      // Combine data
      const users = authUsers.users.map(user => {
        const userRole = userRoles?.find(role => role.user_id === user.id);
        const subscription = subscriptions?.find(sub => sub.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: (userRole?.role as UserRole) || 'user',
          status: (userRole?.status as UserStatus) || 'active',
          subscription_status: subscription?.status,
          subscription_plan: subscription?.plan_name
        };
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user
   */
  static async createUser(
    email: string, 
    password: string, 
    role: UserRole = 'user', 
    status: UserStatus = 'active'
  ): Promise<AdminUser> {
    try {
      if (!supabase) {
        // Return mock data for development
        const mockUser: AdminUser = {
          id: `${Date.now()}`,
          email,
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          role,
          status
        };
        
        return mockUser;
      }
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Add user role and status to custom table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role,
          status
        });
      
      if (roleError) {
        throw roleError;
      }
      
      // Log the action
      await this.logAuditEvent(
        '1', // Admin user ID
        'admin@example.com', // Admin email
        'create',
        'user',
        `Created new user: ${email}`,
        '127.0.0.1' // In a real app, you'd get the actual IP
      );
      
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        last_sign_in_at: null,
        role,
        status
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Update a user's role and status
   */
  static async updateUser(
    userId: string, 
    role: UserRole, 
    status: UserStatus
  ): Promise<void> {
    try {
      if (!supabase) {
        // Mock update for development
        return;
      }
      
      // Update user role and status in custom table
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role,
          status
        });
      
      if (error) {
        throw error;
      }
      
      // Get user email for audit log
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user email:', userError);
      }
      
      // Log the action
      await this.logAuditEvent(
        '1', // Admin user ID
        'admin@example.com', // Admin email
        'update',
        'user',
        `Updated user role to ${role} and status to ${status} for user: ${userData?.email || userId}`,
        '127.0.0.1' // In a real app, you'd get the actual IP
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user
   */
  static async deleteUser(userId: string, userEmail: string): Promise<void> {
    try {
      if (!supabase) {
        // Mock deletion for development
        return;
      }
      
      // Delete user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        throw authError;
      }
      
      // Delete user role from custom table
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) {
        throw roleError;
      }
      
      // Log the action
      await this.logAuditEvent(
        '1', // Admin user ID
        'admin@example.com', // Admin email
        'delete',
        'user',
        `Deleted user: ${userEmail}`,
        '127.0.0.1' // In a real app, you'd get the actual IP
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  /**
   * Get audit logs
   */
  static async getAuditLogs(
    startDate?: string,
    endDate?: string,
    action?: string,
    userId?: string
  ): Promise<AuditLogEntry[]> {
    try {
      if (!supabase) {
        // Return mock data for development
        return this.getMockAuditLogs();
      }
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      }
      
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }
      
      if (action && action !== 'all') {
        query = query.eq('action', action);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Log an audit event
   */
  static async logAuditEvent(
    userId: string,
    userEmail: string,
    action: string,
    resource: string,
    details: string,
    ipAddress: string
  ): Promise<void> {
    try {
      if (!supabase) {
        // Skip logging for development
        return;
      }
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          user_email: userEmail,
          action,
          resource,
          details,
          ip_address: ipAddress
        });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw here to prevent cascading failures
    }
  }
  
  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      if (!supabase) {
        // Return mock data for development
        return {
          total_users: 5,
          active_users_today: 3,
          active_subscriptions: 3,
          total_logins_today: 8,
          average_session_time: 25
        };
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Count total users
      const { count: totalUsers } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true });
      
      // Count active users today
      const { count: activeUsers } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', `${today}T00:00:00.000Z`);
      
      // Count active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // Count total logins today
      const { count: totalLogins } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', `${today}T00:00:00.000Z`);
      
      // Calculate average session time (this would require additional tracking)
      const averageSessionTime = 25; // Mock value in minutes
      
      return {
        total_users: totalUsers || 0,
        active_users_today: activeUsers || 0,
        active_subscriptions: activeSubscriptions || 0,
        total_logins_today: totalLogins || 0,
        average_session_time: averageSessionTime
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }
  
  /**
   * Get admin settings
   */
  static async getAdminSettings(): Promise<AdminSettings> {
    try {
      if (!supabase) {
        // Return mock data for development
        return {
          security: {
            require_mfa: false,
            password_expiry_days: 90,
            session_timeout_minutes: 60
          },
          email: {
            welcome_email_enabled: true,
            password_reset_enabled: true
          },
          system: {
            maintenance_mode: false,
            version: '1.0.0'
          }
        };
      }
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Convert array of settings to object
      const settings: any = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      return {
        security: settings.security || {
          require_mfa: false,
          password_expiry_days: 90,
          session_timeout_minutes: 60
        },
        email: settings.email || {
          welcome_email_enabled: true,
          password_reset_enabled: true
        },
        system: settings.system || {
          maintenance_mode: false,
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }
  }
  
  /**
   * Update admin settings
   */
  static async updateAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    try {
      if (!supabase) {
        // Skip update for development
        return;
      }
      
      // Convert settings object to array of upserts
      const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert(upserts);
      
      if (error) {
        throw error;
      }
      
      // Log the action
      await this.logAuditEvent(
        '1', // Admin user ID
        'admin@example.com', // Admin email
        'update',
        'settings',
        `Updated admin settings: ${Object.keys(settings).join(', ')}`,
        '127.0.0.1' // In a real app, you'd get the actual IP
      );
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }
  
  /**
   * Check if current user has admin role
   */
  static async isAdmin(): Promise<boolean> {
    try {
      if (!supabase) {
        // For development, return true to allow access
        return true;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
  
  /**
   * Get mock users for development
   */
  private static getMockUsers(): AdminUser[] {
    return [
      {
        id: '1',
        email: 'admin@example.com',
        created_at: '2023-01-01T00:00:00.000Z',
        last_sign_in_at: '2023-06-15T10:30:00.000Z',
        role: 'admin',
        status: 'active',
        subscription_status: 'active',
        subscription_plan: 'Enterprise'
      },
      {
        id: '2',
        email: 'manager@example.com',
        created_at: '2023-02-15T00:00:00.000Z',
        last_sign_in_at: '2023-06-14T14:20:00.000Z',
        role: 'manager',
        status: 'active',
        subscription_status: 'active',
        subscription_plan: 'Pro'
      },
      {
        id: '3',
        email: 'user1@example.com',
        created_at: '2023-03-10T00:00:00.000Z',
        last_sign_in_at: '2023-06-10T09:15:00.000Z',
        role: 'user',
        status: 'active',
        subscription_status: 'active',
        subscription_plan: 'Basic'
      },
      {
        id: '4',
        email: 'user2@example.com',
        created_at: '2023-04-05T00:00:00.000Z',
        last_sign_in_at: null,
        role: 'user',
        status: 'pending',
        subscription_status: null,
        subscription_plan: null
      },
      {
        id: '5',
        email: 'suspended@example.com',
        created_at: '2023-05-20T00:00:00.000Z',
        last_sign_in_at: '2023-05-25T16:45:00.000Z',
        role: 'user',
        status: 'suspended',
        subscription_status: 'canceled',
        subscription_plan: 'Basic'
      }
    ];
  }
  
  /**
   * Get mock audit logs for development
   */
  private static getMockAuditLogs(): AuditLogEntry[] {
    return [
      {
        id: '1',
        user_id: '1',
        user_email: 'admin@example.com',
        action: 'login',
        resource: 'auth',
        details: 'User logged in successfully',
        ip_address: '192.168.1.1',
        created_at: '2023-06-15T10:30:00.000Z'
      },
      {
        id: '2',
        user_id: '1',
        user_email: 'admin@example.com',
        action: 'update',
        resource: 'user',
        details: 'Updated user role for user2@example.com',
        ip_address: '192.168.1.1',
        created_at: '2023-06-15T10:35:00.000Z'
      },
      {
        id: '3',
        user_id: '2',
        user_email: 'manager@example.com',
        action: 'login',
        resource: 'auth',
        details: 'User logged in successfully',
        ip_address: '192.168.1.2',
        created_at: '2023-06-14T14:20:00.000Z'
      },
      {
        id: '4',
        user_id: '3',
        user_email: 'user1@example.com',
        action: 'login',
        resource: 'auth',
        details: 'User logged in successfully',
        ip_address: '192.168.1.3',
        created_at: '2023-06-10T09:15:00.000Z'
      },
      {
        id: '5',
        user_id: '1',
        user_email: 'admin@example.com',
        action: 'create',
        resource: 'user',
        details: 'Created new user: user2@example.com',
        ip_address: '192.168.1.1',
        created_at: '2023-04-05T08:00:00.000Z'
      }
    ];
  }
}