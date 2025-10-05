import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  status: string;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfileData>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        // Mock data for development
        const mockProfile: UserProfileData = {
          id: '1',
          email: 'user@example.com',
          full_name: 'John Doe',
          avatar_url: null,
          created_at: '2023-01-01T00:00:00.000Z',
          last_sign_in_at: '2023-06-15T10:30:00.000Z',
          role: 'user',
          status: 'active'
        };
        
        setProfile(mockProfile);
        setEditedProfile(mockProfile);
        setLoading(false);
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (roleError && roleError.code !== 'PGRST116') {
        throw roleError;
      }
      
      const userData: UserProfileData = {
        id: user.id,
        email: user.email || '',
        full_name: profileData?.full_name || null,
        avatar_url: profileData?.avatar_url || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: roleData?.role || 'user',
        status: roleData?.status || 'active'
      };
      
      setProfile(userData);
      setEditedProfile(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!profile) return;
      
      if (!supabase) {
        // Mock update for development
        setProfile({
          ...profile,
          ...editedProfile
        });
        setIsEditing(false);
        setSuccess('Profile updated successfully');
        setLoading(false);
        return;
      }
      
      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: editedProfile.full_name,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        throw updateError;
      }
      
      // Refresh profile data
      await fetchUserProfile();
      
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      
      if (!supabase) {
        // Mock password change for development
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess('Password changed successfully');
        setLoading(false);
        return;
      }
      
      // Change password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <p className="text-gray-600 mt-2">
                View and manage your account information
              </p>
            </div>
            <User className="h-12 w-12 text-blue-600" />
          </div>
        </div>
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
            <X className="h-5 w-5 text-green-600" />
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
            <X className="h-5 w-5 text-red-600" />
          </button>
        </div>
      )}
      
      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              {!isEditing ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedProfile(profile || {});
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="flex flex-col md:flex-row">
                {/* Avatar */}
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-16 w-16" />
                  </div>
                </div>
                
                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  {/* Email */}
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {profile?.email}
                    </div>
                  </div>
                  
                  {/* Full Name */}
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <User className="h-4 w-4 mr-1" />
                      Full Name
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editedProfile.full_name || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                      />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">
                        {profile?.full_name || 'Not set'}
                      </div>
                    )}
                  </div>
                  
                  {/* Account Created */}
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Account Created
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                    </div>
                  </div>
                  
                  {/* Last Login */}
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Last Login
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {profile?.last_sign_in_at ? formatDate(profile.last_sign_in_at) : 'Never'}
                    </div>
                  </div>
                  
                  {/* Role */}
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Shield className="h-4 w-4 mr-1" />
                      Role
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        profile?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        profile?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {profile?.role || 'User'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Security Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
            </div>
            <div className="card-body">
              {isChangingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        className="form-input pr-10"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                      >
                        {showPassword.current ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        className="form-input pr-10"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                      >
                        {showPassword.new ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        className="form-input pr-10"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleChangePassword}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      {loading ? 'Saving...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Password</h4>
                      <p className="text-sm text-gray-500">
                        Change your account password
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900">Account Status</h4>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        profile?.status === 'active' ? 'bg-green-100 text-green-800' :
                        profile?.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;