import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { useEffect } from 'react';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, initialize } = useAuthStore();

  useEffect(() => {
    // Attempt to fetch user if we have a token but no user yet
    if (isAuthenticated && !user && !isLoading) {
      initialize();
    }
  }, [isAuthenticated, user, isLoading, initialize]);

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all roles implicitly
    return user.role === role;
  };

  const canManageCameras = user?.role === 'admin' || user?.role === 'operator';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    canManageCameras,
    isAdmin
  };
}
