'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, mounted, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated traffic light loader */}
        <div className="flex flex-col items-center gap-2 bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="w-10 h-10 rounded-full bg-rose-500/30 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-amber-500/30 animate-pulse [animation-delay:300ms]" />
          <div className="w-10 h-10 rounded-full bg-emerald-500/80 animate-pulse [animation-delay:600ms]" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Loading TrafficAI...</p>
      </div>
    </div>
  );
}
