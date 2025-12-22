import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/authService';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'SUCCESS'>('LOGIN');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, val: string) => {
    setForm({ ...form, [field]: val });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (view === 'SIGNUP') {
      if (!form.name.trim()) return 'Name is required';
      if (!form.username.trim()) return 'Username is required';
      if (!form.email.trim()) return 'Email is required';
      if (!form.password) return 'Password is required';
      if (form.password !== form.confirm) return 'Passwords do not match';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
    } else if (view === 'LOGIN') {
      if (!form.username.trim()) return 'Username is required';
      if (!form.password) return 'Password is required';
    }
    return null;
  };

  const handleSubmission = async () => {
    setError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (view === 'SIGNUP') {
        // Register new user
        await authService.register({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
        });

        // Auto-login after successful registration
        const loginResponse = await authService.login({
          username: form.username,
          password: form.password,
        });

        // Store user data including user_id from login response
        const userData = {
          id: loginResponse.user_id,
          username: form.username,
          name: form.name,
          email: form.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=f59e0b&color=fff`,
          role: loginResponse.role
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Call parent's onLogin with user data
        onLogin(userData);

      } else if (view === 'LOGIN') {
        // Login existing user
        const loginResponse = await authService.login({
          username: form.username,
          password: form.password,
        });

        // Store user data including user_id from login response
        const userData = {
          id: loginResponse.user_id,
          username: form.username,
          name: form.username, // Backend doesn't return user details on login
          email: '', // Not available from login response
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.username)}&background=f59e0b&color=fff`,
          role: loginResponse.role
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Call parent's onLogin with user data
        onLogin(userData);

      } else if (view === 'FORGOT') {
        // TODO: Implement password reset when backend endpoint is ready
        setView('SUCCESS');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);

      // Extract error message from response
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const titles = { LOGIN: 'Log in', SIGNUP: 'Sign up', FORGOT: 'Reset Password', SUCCESS: 'Email Sent' };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">

        <div className="flex justify-between items-center p-4 border-b">
          <button onClick={onClose} disabled={loading}><X size={20} /></button>
          <span className="font-bold text-lg">{titles[view]}</span>
          <div className="w-5" />
        </div>

        <div className="p-6">
          {view === 'SUCCESS' ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="flex justify-center"><CheckCircle size={64} className="text-amber-500" /></div>
              <p className="text-gray-500">Recovery link sent to <span className="font-semibold">{form.email}</span></p>
              <Button variant="primary" className="w-full" onClick={() => setView('LOGIN')}>Back to Login</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-6">
                {view === 'FORGOT' ? 'Recover Account' : 'Welcome to ituBeeNBee'}
              </h3>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded animate-in fade-in">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {view === 'SIGNUP' && (
                <Input
                  label="Name" type="text" placeholder="Full name" value={form.name}
                  onChange={(e: any) => handleChange('name', e.target.value)}
                  disabled={loading}
                />
              )}

              <Input
                label="Username" placeholder="Enter username" value={form.username}
                onChange={(e: any) => handleChange('username', e.target.value)}
                disabled={loading}
              />

              {view === 'SIGNUP' && (
                <Input
                  label="Email" type="email" placeholder="your@email.com" value={form.email}
                  onChange={(e: any) => handleChange('email', e.target.value)}
                  disabled={loading}
                />
              )}

              {view !== 'FORGOT' && (
                <Input
                  label="Password" type="password" placeholder="Enter password" value={form.password}
                  onChange={(e: any) => handleChange('password', e.target.value)}
                  disabled={loading}
                />
              )}

              {view === 'SIGNUP' && (
                <Input
                  label="Confirm Password" type="password" placeholder="Confirm password" value={form.confirm}
                  onChange={(e: any) => handleChange('confirm', e.target.value)}
                  disabled={loading}
                />
              )}

              {view === 'LOGIN' && (
                <div className="text-right">
                  <button
                    onClick={() => setView('FORGOT')}
                    className="text-xs font-semibold text-gray-600 underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                variant="primary"
                className="w-full py-3"
                onClick={handleSubmission}
                disabled={loading}
              >
                {loading ? 'Please wait...' : view === 'LOGIN' ? 'Login' : view === 'SIGNUP' ? 'Sign Up' : 'Send Recovery'}
              </Button>

              <div className="text-center text-sm mt-4">
                <button
                  className="text-amber-600 font-semibold hover:underline"
                  onClick={() => {
                    setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                    setError(null);
                    setForm({ name: '', username: '', email: '', password: '', confirm: '' });
                  }}
                  disabled={loading}
                >
                  {view === 'FORGOT' ? 'Back to Login' : view === 'LOGIN' ? 'Create an account' : 'Log in instead'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};