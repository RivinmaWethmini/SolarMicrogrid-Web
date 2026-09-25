import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SunMedium, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function NavigationHeader({ isOffline = false, subtitle = 'Station 01' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const isActive = (path) => {
    if (path === '/reservations') {
      return location.pathname === '/' || location.pathname === '/reservations';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="operations-topbar">
      <Link to="/reservations" className="operations-brand" aria-label="Solar grid reservation ledger">
        <span className="operations-brand-mark">
          <SunMedium />
        </span>
        <span>
          <strong>Solis microgrid</strong>
          <small>{user?.role ? `${user.role} console` : subtitle}</small>
        </span>
      </Link>

      <nav className="operations-nav" aria-label="Portal navigation sections">
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
        <Link
          to="/scan"
          className={isActive('/scan') ? 'is-current' : ''}
        >
          Verify pass
        </Link>
        {isAdmin && (
          <Link
            to="/admin/approvals"
            className={isActive('/admin') ? 'is-current' : ''}
          >
            Prosumer approvals
          </Link>
        )}
      </nav>

      <div className="operations-topbar-actions">
        <div className={'operations-connection' + (isOffline ? ' is-offline' : '')}>
          <i />
          <span>{isOffline ? 'API offline' : 'Live (5298)'}</span>
        </div>

        {user ? (
          <div className="operations-user-pill">
            <div className="user-avatar-tag" title={user.email || user.username}>
              {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="user-meta-tag">
              <span className="user-email-text">{user.email || user.username}</span>
              <span className={'user-role-badge role-' + (user.role || 'consumer').toLowerCase()}>
                {user.role}
              </span>
            </div>
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
  );
}
