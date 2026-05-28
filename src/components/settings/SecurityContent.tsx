/**
 * Security Content Component
 *
 * Features:
 * 1. Change Password Form
 * 2. Two-Factor Authentication (2FA) Setup/Disable
 * 3. Active Sessions Management
 */

import { useState } from 'react';
import {
  Lock,
  Monitor
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function SecurityContent() {
  const [activeSection, setActiveSection] = useState<'password' | 'sessions'>('password');

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="card">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('password')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeSection === 'password'
                ? 'bg-gold text-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Lock className="inline w-4 h-4 mr-2" />
            Password
          </button>
          <button
            onClick={() => setActiveSection('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeSection === 'sessions'
                ? 'bg-gold text-black'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Monitor className="inline w-4 h-4 mr-2" />
            Active Sessions
          </button>
        </div>
      </div>

      {/* Section Content */}
      {activeSection === 'password' && <ChangePasswordSection />}
      {activeSection === 'sessions' && <ActiveSessionsSection />}
    </div>
  );
}

/**
 * Change Password Section
 */
function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Log security event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_security_events').insert({
          user_id: user.id,
          event_type: 'password_change',
          ip_address: null,
          user_agent: navigator.userAgent
        });
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-purple" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold">Change Password</h2>
          <p className="text-sm text-gray-600">Update your account password</p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <Input
          type="password"
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="Enter your current password"
        />

        <Input
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="At least 8 characters, 1 uppercase, 1 number"
        />

        <Input
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Re-enter your new password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains at least one uppercase letter</li>
            <li>• Contains at least one number</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

/**
 * Active Sessions Section
 */
function ActiveSessionsSection() {
  return (
    <div className="space-y-4">
      <div className="card max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Active Sessions</h2>
            <p className="text-sm text-gray-600">Manage devices with access to your account</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Current Session</p>
                <p className="text-sm text-gray-600">
                  {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                   navigator.userAgent.includes('Firefox') ? 'Firefox' :
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last active: Just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Session Management Coming Soon</p>
          <p className="text-sm text-blue-700">
            Advanced session management features are under development, including:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 mt-2 ml-4">
            <li>• View all active sessions across devices</li>
            <li>• See IP addresses and locations</li>
            <li>• Revoke individual sessions remotely</li>
            <li>• Sign out from all other sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}