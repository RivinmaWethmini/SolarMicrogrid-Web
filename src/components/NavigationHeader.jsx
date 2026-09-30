import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SunMedium, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function NavigationHeader({ isOffline = false, subtitle = 'Station 01' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = (user?.role || '').toLowerCase();
  const isBackoffice = userRole === 'admin' || userRole === 'backoffice';
  const isOperator = userRole === 'gridoperator';

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
    return location.pathname.startsWith(path);
  };

  return (
    <header className="operations-topbar">
      <Link to={isBackoffice ? "/backoffice" : "/reservations"} className="operations-brand" aria-label="Solar grid reservation ledger">
        <span className="operations-brand-mark flex items-center justify-center p-1 bg-amber-500/10 rounded-xl border border-amber-400/30">
          <img src="/solar-logo.png" alt="Solarrays Logo" className="w-6 h-6 object-contain" />
        </span>
        <span>
          <strong>Solarrays Microgrid</strong>
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
        {(isBackoffice || isOperator) && (
          <Link
            to="/scan"
            className={isActive('/scan') ? 'is-current' : ''}
          >
            Verify pass
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/admin/approvals"
            className={isActive('/admin/approvals') ? 'is-current' : ''}
          >
            Prosumer approvals
          </Link>
        )}
      </nav>

      <div className="operations-topbar-actions">
        <div className={'operations-connection' + (isOffline ? ' is-offline' : '')}>
          <i />
          <span>{isOffline ? 'Offline' : 'Online'}</span>
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
