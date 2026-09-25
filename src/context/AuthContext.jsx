import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setTokens,
  clearTokens,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  // Synchronize profile from backend using /auth/me
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      const currentRefresh = getRefreshToken();
      const currentAccess = getAccessToken();
      setTokens(currentAccess, currentRefresh, profile);
      return profile;
    } catch (err) {
      console.warn('Failed to refresh user profile from /auth/me:', err);
      return null;
    }
  }, []);

  // Hydrate session on app mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (accessToken && refreshToken) {
        try {
          const profile = await authApi.getMe();
          if (isMounted) {
            setUser(profile);
            setTokens(accessToken, refreshToken, profile);
          }
        } catch (err) {
          console.warn('Token validation failed during session init:', err);
          if (isMounted) {
            // If token refresh also failed, reset state
            if (!getAccessToken()) {
              setUser(null);
              clearTokens();
            }
          }
        }
      } else {
        clearTokens();
        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initAuth();

    // Listen for global unauthorized event triggered by axios interceptor
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        clearTokens();
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Login handler accepting AuthResponseDto from /auth/otp/verify or /auth/token/refresh
  const loginWithAuthResponse = useCallback((authResponse) => {
    const { accessToken, refreshToken, user: authUser } = authResponse;
    setTokens(accessToken, refreshToken, authUser);
    setUser(authUser);
  }, []);

  // Logout handler calling backend session revocation
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Backend logout call encountered an error:', err);
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  // Role verification helper (supports single role or array of roles)
  const hasRole = useCallback(
    (roleOrRoles) => {
      if (!user?.role) return false;
      if (Array.isArray(roleOrRoles)) {
        return roleOrRoles.some(
          (r) => r.toLowerCase() === user.role.toLowerCase()
        );
      }
      return user.role.toLowerCase() === roleOrRoles.toLowerCase();
    },
    [user]
  );

  // Granular permission check helper
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      // Admin has superuser access over all permissions
      if (user.role?.toLowerCase() === 'admin') return true;
      return user.permissions?.some(
        (p) => p.toLowerCase() === permission.toLowerCase()
      );
    },
    [user]
  );

  const isPendingApproval = Boolean(
    user &&
    user.role?.toLowerCase() === 'prosumer' &&
    user.approvalStatus === 'PendingApproval'
  );

  const isRejected = Boolean(
    user &&
    user.role?.toLowerCase() === 'prosumer' &&
    user.approvalStatus === 'Rejected'
  );

  const isApproved = Boolean(
    user && (user.approvalStatus === 'Approved' || user.role?.toLowerCase() !== 'prosumer')
  );

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user && getAccessToken()),
    isApproved,
    isPendingApproval,
    isRejected,
    loginWithAuthResponse,
    logout,
    refreshProfile,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
