import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SunMedium, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AccountSettingsModal from './AccountSettingsModal';

// NavigationHeader displays the global microgrid operations top bar:
// - Renders brand mark and active role subtitle
// - Dynamically displays navigation links based on user role (Admin, Backoffice, Operator, Prosumer, Consumer)
// - Displays user profile pill, avatar initials, role badge, settings modal trigger, and sign-out button
export default function NavigationHeader({ isOffline = false, subtitle = 'Station 01' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Determine user role and permissions for dynamic navigation rendering
  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isBackoffice = isAdmin || userRole === 'backoffice';
  const isOperator = userRole === 'gridoperator';

  // 2. Sign out handler: Revokes session in backend and redirects user to login screen
  const handleLogout = async () => {
    try {
      toast.dismiss();
      // Invoke AuthContext logout to call /auth/logout and wipe local storage
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.dismiss();
      navigate('/login');
    }
  };

  // Helper to determine if a route is currently active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="operations-topbar">
        <Link to={isBackoffice ? "/backoffice" : "/reservations"} className="operations-brand" aria-label="Solar grid reservation ledger">
          <span className="operations-brand-mark flex items-center justify-center p-1 bg-amber-500/10 rounded-xl border border-amber-400/30">
            <img src="/solar-logo.png" alt="SolarRays Logo" className="w-6 h-6 object-contain" />
          </span>
          <span>
            <strong>SolarRays Microgrid</strong>
            <small>{user?.role ? `${user.role} console` : subtitle}</small>
          </span>
        </Link>

        <nav className="operations-nav" aria-label="Portal navigation sections">
          {isBackoffice && (
            <>
              <Link
                to="/backoffice"
                className={isActive('/backoffice') ? 'is-current' : ''}
              >
                Backoffice
              </Link>
              <Link
                to="/prosumers"
                className={isActive('/prosumers') ? 'is-current' : ''}
              >
                Prosumers
              </Link>
              <Link
                to="/admin/prosumers"
                className={isActive('/admin/prosumers') ? 'is-current' : ''}
              >
                Approvals
              </Link>
            </>
          )}
          <Link
            to="/reservations"
            className={isActive('/reservations') ? 'is-current' : ''}
          >
            Reservations
          </Link>
          <Link
            to="/nodes"
            className={isActive('/nodes') ? 'is-current' : ''}
          >
            Solar nodes
          </Link>
          {(isBackoffice || isOperator || userRole === 'prosumer') && (
            <Link
              to="/scan"
              className={isActive('/scan') ? 'is-current' : ''}
            >
              Verify pass
            </Link>
          )}
        </nav>

        <div className="operations-topbar-actions">
          <div className={'operations-connection' + (isOffline ? ' is-offline' : '')}>
            <i />
            <span>{isOffline ? 'Offline' : 'Online'}</span>
          </div>

          {user ? (
            <div className="operations-user-pill flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 text-inherit bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Open account profile settings"
              >
                <div className="user-avatar-tag" title={user.email || user.username}>
                  {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="user-meta-tag">
                  <span className="user-email-text">{user.fullName || user.username || user.email}</span>
                  <span className={'user-role-badge role-' + (user.role || 'consumer').toLowerCase()}>
                    {user.role}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded text-[#92988d] hover:text-[#e9f85b] transition-colors"
                title="Account profile & settings"
                aria-label="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="user-logout-btn"
                title="Sign out and revoke active session"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="user-login-btn">
              Login
            </Link>
          )}
        </div>
      </header>

      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
