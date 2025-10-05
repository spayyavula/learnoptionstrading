import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  Filter, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define user role types
type UserRole = 'admin' | 'manager' | 'user';

// User interface
interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  subscription_status?: string;
  subscription_plan?: string;
}

// Audit log entry interface
interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

// System stats interface
interface SystemStats {
  total_users: number;
  active_users_today: number;
  active_subscriptions: number;
  total_logins_today: number;
  average_session_time: number;
}

const AdminDashboard: React.FC = () => {
  // State for users
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // State for audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logDateRange, setLogDateRange] = useState<{start: string, end: string}>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // State for system stats
  const [systemStats, setSystemStats] = useState<SystemStats>({
    total_users: 0,
    active_users_today: 0,
    active_subscriptions: 0,
    total_logins_today: 0,
    average_session_time: 0
  });
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user' as UserRole,
    status: 'active' as 'active' | 'suspended' | 'pending'
  });
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'stats'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
    fetchSystemStats();
  }, []);
  
  // Filter users when search term or filters change
  useEffect(() => {
    filterUsers();
  }, [users, userSearchTerm, userRoleFilter, userStatusFilter]);
  
  // Filter logs when search term or filters change
  useEffect(() => {
    filterLogs();
  }, [auditLogs, logSearchTerm, logActionFilter, logDateRange]);
  
  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        // Mock data for development
        const mockUsers: User[] = [
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
        
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
        setLoading(false);
        return;
      }
      
      // Fetch users from Supabase
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }
      
      // Fetch user roles and status from a custom table
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
      const combinedUsers = authUsers.users.map(user => {
        const userRole = userRoles?.find(role => role.user_id === user.id);
        const subscription = subscriptions?.find(sub => sub.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: (userRole?.role as UserRole) || 'user',
          status: (userRole?.status as 'active' | 'suspended' | 'pending') || 'active',
          subscription_status: subscription?.status,
          subscription_plan: subscription?.plan_name
        };
      });
      
      setUsers(combinedUsers);
      setFilteredUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      if (!supabase) {
        // Mock data for development
        const mockLogs: AuditLogEntry[] = [
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
        
        setAuditLogs(mockLogs);
        setFilteredLogs(mockLogs);
        return;
      }
      
      // Fetch audit logs from Supabase
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAuditLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to fetch audit logs. Please try again.');
    }
  };
  
  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      if (!supabase) {
        // Mock data for development
        setSystemStats({
          total_users: 5,
          active_users_today: 3,
          active_subscriptions: 3,
          total_logins_today: 8,
          average_session_time: 25
        });
        return;
      }
      
      // In a real implementation, you would fetch these stats from Supabase
      // For now, we'll use the mock data
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
      
      setSystemStats({
        total_users: totalUsers || 0,
        active_users_today: activeUsers || 0,
        active_subscriptions: activeSubscriptions || 0,
        total_logins_today: totalLogins || 0,
        average_session_time: averageSessionTime
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };
  
  // Filter users based on search term and filters
  const filterUsers = () => {
    let filtered = [...users];
    
    // Apply search filter
    if (userSearchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }
    
    // Apply status filter
    if (userStatusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === userStatusFilter);
    }
    
    setFilteredUsers(filtered);
  };
  
  // Filter logs based on search term and filters
  const filterLogs = () => {
    let filtered = [...auditLogs];
    
    // Apply search filter
    if (logSearchTerm) {
      filtered = filtered.filter(log => 
        log.user_email.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(logSearchTerm.toLowerCase())
      );
    }
    
    // Apply action filter
    if (logActionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === logActionFilter);
    }
    
    // Apply date range filter
    const startDate = new Date(logDateRange.start);
    const endDate = new Date(logDateRange.end);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    filtered = filtered.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= startDate && logDate <= endDate;
    });
    
    setFilteredLogs(filtered);
  };
  
  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(false);
  };
  
  // Handle user form submission (create/update)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (isAddingUser) {
        // Create new user
        if (!supabase) {
          // Mock creation for development
          const newUserObj: User = {
            id: `${Date.now()}`,
            email: newUser.email,
            created_at: new Date().toISOString(),
            last_sign_in_at: null,
            role: newUser.role,
            status: newUser.status
          };
          
          setUsers([...users, newUserObj]);
          
          // Log the action
          const newLog: AuditLogEntry = {
            id: `${Date.now()}`,
            user_id: '1', // Admin user
            user_email: 'admin@example.com',
            action: 'create',
            resource: 'user',
            details: `Created new user: ${newUser.email}`,
            ip_address: '192.168.1.1',
            created_at: new Date().toISOString()
          };
          
          setAuditLogs([newLog, ...auditLogs]);
          
          setSuccess('User created successfully');
          setIsAddingUser(false);
          setNewUser({
            email: '',
            password: '',
            role: 'user',
            status: 'active'
          });
          return;
        }
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
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
            role: newUser.role,
            status: newUser.status
          });
        
        if (roleError) {
          throw roleError;
        }
        
        // Log the action
        await supabase
          .from('audit_logs')
          .insert({
            user_id: '1', // Admin user ID
            user_email: 'admin@example.com', // Admin email
            action: 'create',
            resource: 'user',
            details: `Created new user: ${newUser.email}`,
            ip_address: '127.0.0.1' // In a real app, you'd get the actual IP
          });
        
        setSuccess('User created successfully');
        fetchUsers(); // Refresh user list
      } else if (isEditingUser && selectedUser) {
        // Update existing user
        if (!supabase) {
          // Mock update for development
          const updatedUsers = users.map(user => 
            user.id === selectedUser.id 
              ? { ...user, role: selectedUser.role, status: selectedUser.status } 
              : user
          );
          
          setUsers(updatedUsers);
          
          // Log the action
          const newLog: AuditLogEntry = {
            id: `${Date.now()}`,
            user_id: '1', // Admin user
            user_email: 'admin@example.com',
            action: 'update',
            resource: 'user',
            details: `Updated user: ${selectedUser.email}`,
            ip_address: '192.168.1.1',
            created_at: new Date().toISOString()
          };
          
          setAuditLogs([newLog, ...auditLogs]);
          
          setSuccess('User updated successfully');
          setIsEditingUser(false);
          return;
        }
        
        // Update user role and status in custom table
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedUser.id,
            role: selectedUser.role,
            status: selectedUser.status
          });
        
        if (roleError) {
          throw roleError;
        }
        
        // Log the action
        await supabase
          .from('audit_logs')
          .insert({
            user_id: '1', // Admin user ID
            user_email: 'admin@example.com', // Admin email
            action: 'update',
            resource: 'user',
            details: `Updated user: ${selectedUser.email}`,
            ip_address: '127.0.0.1' // In a real app, you'd get the actual IP
          });
        
        setSuccess('User updated successfully');
        fetchUsers(); // Refresh user list
        setIsEditingUser(false);
      }
    } catch (error) {
      console.error('Error submitting user form:', error);
      setError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        // Mock deletion for development
        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);
        
        // Log the action
        const newLog: AuditLogEntry = {
          id: `${Date.now()}`,
          user_id: '1', // Admin user
          user_email: 'admin@example.com',
          action: 'delete',
          resource: 'user',
          details: `Deleted user: ${userEmail}`,
          ip_address: '192.168.1.1',
          created_at: new Date().toISOString()
        };
        
        setAuditLogs([newLog, ...auditLogs]);
        
        setSuccess('User deleted successfully');
        setSelectedUser(null);
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
      await supabase
        .from('audit_logs')
        .insert({
          user_id: '1', // Admin user ID
          user_email: 'admin@example.com', // Admin email
          action: 'delete',
          resource: 'user',
          details: `Deleted user: ${userEmail}`,
          ip_address: '127.0.0.1' // In a real app, you'd get the actual IP
        });
      
      setSuccess('User deleted successfully');
      fetchUsers(); // Refresh user list
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Export logs to CSV
  const exportLogsToCSV = () => {
    const headers = ['ID', 'User', 'Action', 'Resource', 'Details', 'IP Address', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.user_email,
        log.action,
        log.resource,
        `"${log.details.replace(/"/g, '""')}"`, // Escape quotes in CSV
        log.ip_address,
        new Date(log.created_at).toLocaleString()
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get role badge class
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get action badge class
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="text-gray-600 mt-2">
                Manage users, view logs, and monitor system performance
              </p>
            </div>
            <ShieldCheck className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>
      
      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 inline mr-2" />
          User Management
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'logs'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity className="h-4 w-4 inline mr-2" />
          Audit Logs
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'stats'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          System Statistics
        </button>
      </div>
      
      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative">
          <div className="flex">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <XCircle className="h-5 w-5 text-green-600" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <div className="flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <XCircle className="h-5 w-5 text-red-600" />
          </button>
        </div>
      )}
      
      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users by email..."
                      className="form-input pl-10"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <select
                    className="form-select"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                  
                  <select
                    className="form-select"
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                  
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setIsAddingUser(true);
                      setSelectedUser(null);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* User List and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Users</h3>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                      <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Login
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user) => (
                            <tr 
                              key={user.id} 
                              className={`hover:bg-gray-50 cursor-pointer ${
                                selectedUser?.id === user.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleSelectUser(user)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                {user.subscription_plan && (
                                  <div className="text-xs text-gray-500">
                                    {user.subscription_plan} Plan
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.last_sign_in_at 
                                  ? new Date(user.last_sign_in_at).toLocaleDateString() 
                                  : 'Never'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setIsEditingUser(true);
                                    setIsAddingUser(false);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user.id, user.email);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* User Details or Form */}
            <div className="lg:col-span-1">
              {isAddingUser ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleUserSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-input pr-10"
                              value={newUser.password}
                              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                              required
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={newUser.status}
                            onChange={(e) => setNewUser({...newUser, status: e.target.value as 'active' | 'suspended' | 'pending'})}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsAddingUser(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Create User'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              ) : isEditingUser && selectedUser ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleUserSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-input bg-gray-100"
                            value={selectedUser.email}
                            disabled
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={selectedUser.role}
                            onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as UserRole})}
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={selectedUser.status}
                            onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value as 'active' | 'suspended' | 'pending'})}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsEditingUser(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Update User'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              ) : selectedUser ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User className="h-12 w-12" />
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Email</h4>
                        <p className="text-base font-medium text-gray-900">{selectedUser.email}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Role</h4>
                        <p className="text-base font-medium">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(selectedUser.role)}`}>
                            {selectedUser.role}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <p className="text-base font-medium">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedUser.status)}`}>
                            {selectedUser.status}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Subscription</h4>
                        <p className="text-base font-medium text-gray-900">
                          {selectedUser.subscription_plan 
                            ? `${selectedUser.subscription_plan} (${selectedUser.subscription_status})` 
                            : 'No active subscription'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Created</h4>
                        <p className="text-base font-medium text-gray-900">
                          {formatDate(selectedUser.created_at)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Last Login</h4>
                        <p className="text-base font-medium text-gray-900">
                          {formatDate(selectedUser.last_sign_in_at)}
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          className="btn btn-primary"
                          onClick={() => setIsEditingUser(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No User Selected</h3>
                    <p className="text-gray-500 mt-2">
                      Select a user from the list to view details or click "Add User" to create a new user.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Log Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search logs by user or details..."
                      className="form-input pl-10"
                      value={logSearchTerm}
                      onChange={(e) => setLogSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <select
                    className="form-select"
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                  >
                    <option value="all">All Actions</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                  </select>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="form-input"
                      value={logDateRange.start}
                      onChange={(e) => setLogDateRange({...logDateRange, start: e.target.value})}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      className="form-input"
                      value={logDateRange.end}
                      onChange={(e) => setLogDateRange({...logDateRange, end: e.target.value})}
                    />
                  </div>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={exportLogsToCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Logs Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{log.user_email}</div>
                            <div className="text-xs text-gray-500">{log.user_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.resource}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* System Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{systemStats.total_users}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Today</p>
                    <p className="text-3xl font-bold text-gray-900">{systemStats.active_users_today}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="h-10 w-10 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{systemStats.active_subscriptions}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-10 w-10 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Logins Today</p>
                    <p className="text-3xl font-bold text-gray-900">{systemStats.total_logins_today}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-10 w-10 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg. Session</p>
                    <p className="text-3xl font-bold text-gray-900">{systemStats.average_session_time}m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Growth Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
            </div>
            <div className="card-body">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    User growth chart will be displayed here.
                    <br />
                    Connect to your analytics service for real-time data.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* System Health */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">API Services</span>
                    </div>
                    <span className="text-green-600 text-sm">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <span className="text-green-600 text-sm">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Authentication</span>
                    </div>
                    <span className="text-green-600 text-sm">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <span className="text-green-600 text-sm">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Payment Processing</span>
                    </div>
                    <span className="text-green-600 text-sm">Operational</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        log.action === 'login' ? 'bg-purple-100 text-purple-600' :
                        log.action === 'create' ? 'bg-green-100 text-green-600' :
                        log.action === 'update' ? 'bg-blue-100 text-blue-600' :
                        log.action === 'delete' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action === 'login' && <User className="h-4 w-4" />}
                        {log.action === 'create' && <UserPlus className="h-4 w-4" />}
                        {log.action === 'update' && <Edit className="h-4 w-4" />}
                        {log.action === 'delete' && <Trash2 className="h-4 w-4" />}
                        {!['login', 'create', 'update', 'delete'].includes(log.action) && <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.details}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{log.user_email}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;