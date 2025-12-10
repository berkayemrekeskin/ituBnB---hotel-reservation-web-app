import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

interface AuthModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT' | 'SUCCESS'>('LOGIN');
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });

  const handleChange = (field: string, val: string) => setForm({ ...form, [field]: val });

  const handleSubmission = () => {
    console.log(`[DEMO SUBMISSION] View: ${view}`, form);

    if (view === 'FORGOT') {
      setView('SUCCESS');
    } else {
      onLogin(); 
    }
  };

  const titles = { LOGIN: 'Log in', SIGNUP: 'Sign up', FORGOT: 'Reset Password', SUCCESS: 'Email Sent' };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        <div className="flex justify-between items-center p-4 border-b">
          <button onClick={onClose}><X size={20} /></button>
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
              
              <Input 
                label="Email" placeholder="Enter email" value={form.email} 
                onChange={(e: any) => handleChange('email', e.target.value)} 
              />
              
              {view !== 'FORGOT' && (
                <Input 
                  label="Password" type="password" placeholder="Enter password" value={form.password} 
                  onChange={(e: any) => handleChange('password', e.target.value)} 
                />
              )}
              
              {view === 'SIGNUP' && (
                <Input 
                  label="Confirm" type="password" placeholder="Confirm password" value={form.confirm} 
                  onChange={(e: any) => handleChange('confirm', e.target.value)} 
                />
              )}

              {view === 'LOGIN' && (
                <div className="text-right">
                  <button onClick={() => setView('FORGOT')} className="text-xs font-semibold text-gray-600 underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button variant="primary" className="w-full py-3" onClick={handleSubmission}>
                {view === 'LOGIN' ? 'Login' : view === 'SIGNUP' ? 'Sign Up' : 'Send Recovery'}
              </Button>

              <div className="text-center text-sm mt-4">
                 <button className="text-amber-600 font-semibold hover:underline" onClick={() => setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}>
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