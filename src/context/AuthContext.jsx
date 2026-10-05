import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setTokens,
  clearTokens,
} from '../services/api';

// Create the React Context for managing global authentication state
const AuthContext = createContext(null);

// AuthProvider wraps the application tree and exposes authentication state,
// session persistence, RBAC role verification, and profile management methods.
export function AuthProvider({ children }) {
  // 1. Initialize user state from localStorage or preview fallback
  const [user, setUser] = useState(() => {
    // Check if a previously authenticated user is cached in localStorage
    const stored = getStoredUser();
    if (stored) return stored;

    // Snapshot preview bypass for offline testing and design reviews
    if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
      return {
        id: 'admin-preview-1',
        name: 'Rivinma Admin',
        username: 'Rivinma',
        email: 'dissanayakerivinma@gmail.com',
        role: 'Admin',
        approvalStatus: 'Approved',
      };
    }
    return null;
  });

  // 2. Track session hydration loading state (true during initial token check)
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) return false;
    return !getStoredUser();
  });

  // 3. Synchronize user profile and claims with the backend /auth/me endpoint
  const refreshProfile = useCallback(async () => {
    try {
      // Query current user profile and permission claims from backend
      const profile = await authApi.getMe();
      setUser(profile);

      // Keep localStorage in sync with the latest profile information
      const currentRefresh = getRefreshToken();
      const currentAccess = getAccessToken();
      setTokens(currentAccess, currentRefresh, profile);
      return profile;
    } catch (err) {
      console.warn('Failed to refresh user profile from /auth/me:', err);
      return null;
    }
  }, []);

  // 4. Hydrate authentication session on initial application mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // Skip backend network check if preview mode is active
      if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
        setLoading(false);
        return;
      }

      // Read stored JWT tokens from browser localStorage
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      // If both tokens exist, validate the session by fetching the current profile
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
            // If token validation fails and no valid access token remains, purge storage
            if (!getAccessToken()) {
              setUser(null);
              clearTokens();
            }
          }
        }
      } else {
        // No stored session found: ensure storage is clean and user is null
        clearTokens();
        if (isMounted) {
          setUser(null);
        }
      }

      // Finish loading once session hydration completes
      if (isMounted) {
        setLoading(false);
      }
    }

    // Execute session initialization
    initAuth();

    // 5. Global Unauthorized Event Listener
    // Dispatched by Axios interceptor when a refresh token fails or is revoked
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        clearTokens();
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Clean up event listener when provider unmounts
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // 6. Login handler: accepts authentication response DTO, persists tokens, and sets active user
  const loginWithAuthResponse = useCallback((authResponse) => {
    const { accessToken, refreshToken, user: authUser } = authResponse;
    // Persist JWT access token and refresh token into localStorage
    setTokens(accessToken, refreshToken, authUser);
    // Update active user state in React Context
    setUser(authUser);
  }, []);

  // 7. Logout handler: revokes session in backend MongoDB and purges local browser tokens
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        // Notify backend to mark session as revoked in the database
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Backend logout call encountered an error:', err);
    } finally {
      // Always purge tokens and clear user state, even if network request fails
      clearTokens();
      setUser(null);
    }
  }, []);

  // 8. Self-service profile updates (FullName, Username, Password changes)
  const updateProfile = useCallback(async (data) => {
    // Send updated user details to backend API
    const updated = await authApi.updateProfile(data);
    setUser(updated);

    // Synchronize localStorage with updated user profile
    const currentRefresh = getRefreshToken();
    const currentAccess = getAccessToken();
    setTokens(currentAccess, currentRefresh, updated);
    return updated;
  }, []);

  // 9. Self-service account termination
  const deleteAccount = useCallback(async () => {
    // Permanently delete user account and associated credentials
    await authApi.deleteAccount();
    clearTokens();
    setUser(null);
  }, []);

  // 10. Role verification helper (supports checking a single role string or an array of allowed roles)
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

  // 11. Granular permission claim check helper
  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      // Administrator has superuser privilege: grant all permissions
      if (user.role?.toLowerCase() === 'admin') return true;
      // Check if user has the specific claim in their permissions array
      return user.permissions?.some(
        (p) => p.toLowerCase() === permission.toLowerCase()
      );
    },
    [user]
  );

  // 12. Helper flags for Prosumer & Operator KYC approval workflow
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

  // 13. Bundle all state and handlers into context value object
  const value = {
    user,
    loading,
    isAuthenticated: Boolean((user && getAccessToken()) || (typeof window !== 'undefined' && window.location.search.includes('preview=true'))),
    isApproved,
    isPendingApproval,
    isRejected,
    loginWithAuthResponse,
    logout,
    refreshProfile,
    updateProfile,
    deleteAccount,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to consume the AuthContext safely
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
