'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Eye, EyeOff, Lock, User, Zap, Shield, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, mounted, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter your credentials');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: 'admin' | 'operator' | 'viewer') => {
    const creds = { admin: 'admin123', operator: 'operator123', viewer: 'viewer123' };
    setUsername(role);
    setPassword(creds[role]);
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]" />

      {/* Feature badges (decorative, left side) */}
      <div className="absolute left-8 bottom-8 hidden xl:flex flex-col gap-3">
        {[
          { icon: Zap, text: 'Real-time AI Detection' },
          { icon: Shield, text: 'Emergency Preemption' },
          { icon: Activity, text: 'Adaptive Signals' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800">
            <Icon className="w-4 h-4 text-indigo-400" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-indigo-950/50">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            {/* Traffic light icon */}
            <div className="relative mb-4">
              <div className="w-16 h-20 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 p-2 shadow-inner">
                <div className="w-6 h-6 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                <div className="w-6 h-6 rounded-full bg-amber-500/30" />
                <div className="w-6 h-6 rounded-full bg-emerald-500/30" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              TrafficAI
            </h1>
            <p className="text-slate-400 text-sm mt-1">Smart Traffic Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                    placeholder:text-slate-500 transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-10 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                    placeholder:text-slate-500 transition-all"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50
                active:scale-[0.98] relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </span>
              <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center mb-3">Quick access — demo credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'operator', 'viewer'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="text-xs py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700
                    text-slate-300 hover:text-slate-100 transition-all capitalize font-medium"
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-xs text-center mt-2">
              Password is <code className="text-slate-500">[role]123</code>
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-slate-600 text-xs mt-4">
          TrafficAI v1.0.0 — Production-grade AI Traffic Management
        </p>
      </div>
    </div>
  );
}
