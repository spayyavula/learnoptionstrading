// Admin system types

export type UserRole = 'admin' | 'manager' | 'user';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: UserRole;
  status: UserStatus;
  subscription_status?: string;
  subscription_plan?: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users_today: number;
  active_subscriptions: number;
  total_logins_today: number;
  average_session_time: number;
}

export interface AdminSettings {
  security: {
    require_mfa: boolean;
    password_expiry_days: number;
    session_timeout_minutes: number;
  };
  email: {
    welcome_email_enabled: boolean;
    password_reset_enabled: boolean;
  };
  system: {
    maintenance_mode: boolean;
    version: string;
  };
}

export interface AdminPermission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  admin: AdminPermission[];
  manager: AdminPermission[];
  user: AdminPermission[];
}

// Default permissions configuration
export const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'logs', actions: ['read', 'export'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'subscriptions', actions: ['read', 'update', 'cancel'] }
  ],
  manager: [
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'logs', actions: ['read'] },
    { resource: 'settings', actions: ['read'] },
    { resource: 'subscriptions', actions: ['read'] }
  ],
  user: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'subscription', actions: ['read'] }
  ]
};

// Check if a user has permission for a specific action
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const rolePermissions = DEFAULT_PERMISSIONS[userRole] || [];
  const resourcePermission = rolePermissions.find(p => p.resource === resource);
  
  if (!resourcePermission) {
    return false;
  }
  
  return resourcePermission.actions.includes(action);
}