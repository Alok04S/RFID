import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Radio, 
  Shield, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';

export function LoginPage({ onLoginSuccess }) {
  // 2 Roles: 'GUARD' | 'ADMIN'
  const [selectedRole, setSelectedRole] = useState('GUARD');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roleDetails = {
    GUARD: {
      title: 'Security Guard Booth',
      subtitle: 'Gate Entry RFID Scanner Workstation',
      username: 'guard',
      defaultPass: 'guard123',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    ADMIN: {
      title: 'Super Administrator',
      subtitle: 'Student Database, Master CSV Import, RFID Cards & Gate Logs',
      username: 'admin',
      defaultPass: 'admin123',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const creds = {
        role: selectedRole,
        username: roleDetails[selectedRole].username,
        password: password || roleDetails[selectedRole].defaultPass
      };

      const res = await api.login(creds);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setSelectedRole(role);
    setIsLoading(true);
    setError('');
    try {
      const creds = {
        role,
        username: roleDetails[role].username,
        password: roleDetails[role].defaultPass
      };
      const res = await api.login(creds);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const current = roleDetails[selectedRole];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      {/* Official SGGS College Banner */}
      <div className="text-center mb-6 max-w-xl w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
          <img
            src="/sggs_banner.png"
            alt="Shri Guru Gobind Singhji Institute of Engineering & Technology, Nanded"
            className="w-full max-h-24 object-contain mx-auto"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-1.5">
          <Radio className="w-3.5 h-3.5" />
          <span>Hostel Gate Entry Management System</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          RFID Resident Authentication • Security Guard & Admin Workstation
        </p>
      </div>

      {/* Main Login Card (Clean Light White) */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full p-6 sm:p-8">
        {/* 2 Role Selection Tabs: Guard & Admin */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => { setSelectedRole('GUARD'); setPassword(''); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'GUARD'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Guard Booth</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('ADMIN'); setPassword(''); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRole === 'ADMIN'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Administrator</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Portal Account
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={`${current.title} (${current.username})`}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              />
              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {current.subtitle}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Access Password
            </label>
            <input
              type="password"
              placeholder={`Default: ${current.defaultPass}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Primary Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? 'Authenticating...' : `Log In to ${selectedRole} Portal`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick 1-Click Demo Login */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => handleQuickLogin(selectedRole)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ 1-Click Instant Demo Login as {selectedRole}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500 font-medium">
        Shivaji Residence Hall Security • Minimal Guard Booth Workstation
      </div>
    </div>
  );
}
