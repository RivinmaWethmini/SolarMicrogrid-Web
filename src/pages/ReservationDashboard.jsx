import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  Leaf,
  LogOut,
  Network,
  QrCode,
  RefreshCw,
  Rows3,
  ScanLine,
  Search,
  ShieldCheck,
  Sun,
  SunMedium,
  User,
  X,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReservationRow from '../components/ReservationRow';

const TABLE_HEADERS = [
  'Reference',
  'Prosumer',
  'Microgrid node',
  'Energy',
  'Window opens',
  'Window closes',
  'State',
  'Operator action',
];

const FILTERS = ['All', 'Pending', 'Approved', 'Cancelled', 'Rejected'];

function shortReference(value, length = 8) {
  if (value === null || value === undefined || value === '') return 'Unassigned';
  return String(value).slice(-length).toUpperCase();
}

function SkeletonRow({ index }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.035 }}
      className="ledger-skeleton-row"
    >
      {[...Array(8)].map((_, cellIndex) => (
        <td key={cellIndex}>
          <span
            className="ledger-skeleton-line"
            style={{ width: ['72px', '112px', '96px', '64px', '104px', '104px', '72px', '126px'][cellIndex] }}
          />
        </td>
      ))}
    </motion.tr>
  );
}

function EmptyState({ filter }) {
  const isFiltered = filter !== 'All';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="ledger-empty"
    >
      <div className="ledger-empty-mark" aria-hidden="true">
        <Rows3 />
        <span>00</span>
      </div>
      <div>
        <h3>{isFiltered ? 'Nothing in this lane' : 'The dispatch ledger is clear'}</h3>
        <p>
          {isFiltered
            ? 'No reservations currently match the ' + filter.toLowerCase() + ' state.'
            : 'There are no active energy reservations waiting in the grid queue.'}
        </p>
      </div>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="ledger-error">
      <AlertTriangle aria-hidden="true" />
      <div>
        <h3>Controller link interrupted</h3>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        Retry link
      </button>
    </div>
  );
}

function MetricCell({ index, label, value, note, ratio, tone = 'neutral', loading, priority = false }) {
  const safeRatio = Math.max(0, Math.min(100, Number.isFinite(ratio) ? ratio : 0));

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className={'telemetry-cell tone-' + tone + (priority ? ' is-priority' : '')}
    >
      <div className="telemetry-label">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <p>{label}</p>
      </div>
      <div className="telemetry-reading">
        <strong>{loading ? '··' : value}</strong>
        <span>{note}</span>
      </div>
      <div className="telemetry-meter" aria-hidden="true">
        <i style={{ width: (loading ? 22 : safeRatio) + '%' }} />
      </div>
    </motion.article>
  );
}

function FilterTab({ label, active, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'ledger-filter' + (active ? ' is-active' : '')}
      aria-pressed={active}
    >
      <span>{label}</span>
      <small>{count}</small>
    </button>
  );
}

function GridFlow({ pending, approved, error, loading }) {
  return (
    <div className="grid-flow" aria-label="Live grid routing overview">
      <div className="grid-flow-head">
        <div>
          <span className="grid-flow-index">Live route</span>
          <h2>Energy request path</h2>
        </div>
        <Activity aria-hidden="true" />
      </div>

      <div className="grid-flow-track">
        <div className="flow-point">
          <span className="flow-node"><SunMedium /></span>
          <p>Solar nodes</p>
          <small>Supply online</small>
        </div>
        <div className="flow-connector"><i /></div>
        <div className="flow-point is-focus">
          <span className="flow-node"><Rows3 /></span>
          <p>Review queue</p>
          <small>{loading ? 'Syncing' : pending + ' awaiting review'}</small>
        </div>
        <div className="flow-connector"><i /></div>
        <div className="flow-point">
          <span className="flow-node"><Zap /></span>
          <p>Dispatch</p>
          <small>{loading ? 'Syncing' : approved + ' cleared'}</small>
        </div>
      </div>

      <div className="grid-flow-foot">
        <span className={'connection-line' + (error ? ' is-offline' : '')}>
          <i />
          {error ? 'API link offline' : 'Controller is receiving live data'}
        </span>
        <span>Port 5298</span>
      </div>
    </div>
  );
}

function QrModal({ reservation, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!reservation) return null;

  const isApproved = String(reservation.status || '').toLowerCase() === 'approved';
  const payload = reservation.qrPayload || (isApproved ? JSON.stringify({
    type: 'SOLAR_MICROGRID_DISPATCH_QR',
    version: '1.0',
    reservationId: reservation.id ?? reservation.reservationId,
    prosumerId: reservation.prosumerNic ?? reservation.prosumerId,
    nodeId: reservation.nodeId,
    reservationDate: reservation.reservationDate,
    status: 'Approved',
    issuedAt: new Date().toISOString(),
    securityToken: 'APPROVED_DISPATCH',
  }) : null);

  const qrImageUrl = payload
    ? 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(payload)
    : null;

  const handleCopy = async () => {
    if (!payload) return;

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      toast.success('Dispatch token copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the dispatch token');
    }
  };

  return (
    <div
      className="dispatch-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        className="dispatch-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-pass-title"
      >
        <div className="dispatch-modal-rail">
          <span>Dispatch pass</span>
          <strong>{shortReference(reservation.id ?? reservation.reservationId)}</strong>
          <ShieldCheck aria-hidden="true" />
        </div>

        <div className="dispatch-modal-body">
          <div className="dispatch-modal-head">
            <div>
              <span>Approved reservation</span>
              <h2 id="dispatch-pass-title">Station verification token</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close dispatch pass">
              <X aria-hidden="true" />
            </button>
          </div>

          {qrImageUrl ? (
            <div className="dispatch-pass-layout">
              <div className="qr-instrument">
                <span className="corner corner-one" />
                <span className="corner corner-two" />
                <span className="corner corner-three" />
                <span className="corner corner-four" />
                <img src={qrImageUrl} alt="Scannable dispatch verification code" />
              </div>

              <div className="dispatch-pass-meta">
                <div>
                  <span>Microgrid node</span>
                  <strong>{reservation.nodeName || reservation.nodeId || 'Solar node'}</strong>
                </div>
                <div>
                  <span>Prosumer</span>
                  <strong>{reservation.prosumerNic ?? reservation.prosumerId ?? 'Not assigned'}</strong>
                </div>
                <div>
                  <span>Reservation window</span>
                  <strong>
                    {reservation.startTime
                      ? String(reservation.startTime).replace('T', ' ')
                      : 'See station ledger'}
                  </strong>
                </div>
                <span className="pass-ready"><i /> Ready to scan</span>
              </div>
            </div>
          ) : (
            <div className="dispatch-pass-unavailable">
              <AlertTriangle aria-hidden="true" />
              <div>
                <h3>No verified token</h3>
                <p>The server has not issued an authentic dispatch payload for this reservation.</p>
              </div>
            </div>
          )}

          {payload && (
            <div className="token-strip">
              <div>
                <span>Encrypted payload</span>
                <code>{payload}</code>
              </div>
              <button type="button" onClick={handleCopy}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy token'}
              </button>
            </div>
          )}

          <button type="button" className="modal-done" onClick={onClose}>
            Return to ledger
            <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ReservationDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    approvedFutureReservations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [selectedQrReservation, setSelectedQrReservation] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isProsumer = userRole === 'prosumer';
  const isConsumer = userRole === 'consumer';

  const portalConfig = isAdmin
    ? {
        title: 'Grid Operator Portal',
        badge: 'Live Operator',
        badgeClass: 'bg-[#FFD000]/15 text-[#FFD000] border-[#FFD000]/30',
        icon: <ShieldCheck className="w-3 h-3" />,
        subtitle: 'Smart Solar Microgrid Energy Slot Reservation & Dispatch Control Center',
        tableTitle: 'Energy Slot Reservation Queue',
        statPendingLabel: 'Pending Action',
        statApprovedLabel: 'Approved',
        statApprovedFutureLabel: 'Approved Future',
      }
    : isProsumer
    ? {
        title: 'Solar Prosumer Dispatch Portal',
        badge: 'Solar Producer',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: <Sun className="w-3 h-3 text-amber-400" />,
        subtitle: 'Solar Generation Slot Booking, Dispatch Passes & Grid Injection Schedules',
        tableTitle: 'Energy Injection & Dispatch Reservations',
        statPendingLabel: 'Pending Verification',
        statApprovedLabel: 'Active Passes',
        statApprovedFutureLabel: 'Scheduled Slots',
      }
    : {
        title: 'Clean Energy Consumer Portal',
        badge: 'Clean Energy Buyer',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        icon: <Leaf className="w-3 h-3 text-emerald-400" />,
        subtitle: 'Smart Solar Microgrid Clean Energy Booking & Grid Consumption Overview',
        tableTitle: 'Clean Energy Slot Reservations',
        statPendingLabel: 'Pending Allocation',
        statApprovedLabel: 'Confirmed Clean Power',
        statApprovedFutureLabel: 'Upcoming Deliveries',
      };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const fetchReservationsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [reservationsRes, statsRes] = await Promise.allSettled([
        api.get('/reservations'),
        api.get('/reservations/stats'),
      ]);

      if (reservationsRes.status !== 'fulfilled') {
        throw reservationsRes.reason;
      }

      const data = (reservationsRes.value.data || []).map((item) => ({
        id: item.id ?? item.reservationId,
        ...item,
      }));
      setReservations(data);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        const now = new Date();
        const total = data.length;
        const pending = data.filter((item) => !item.status || item.status === 'Pending').length;
        const approved = data.filter((item) => item.status === 'Approved').length;
        const rejected = data.filter((item) => item.status === 'Rejected').length;
        const cancelled = data.filter((item) => item.status === 'Cancelled').length;
        const approvedFutureReservations = data.filter(
          (item) => item.status === 'Approved' && new Date(item.startTime) > now
        ).length;

        setStats({ total, pending, approved, rejected, cancelled, approvedFutureReservations });
      }

      setLastSyncedAt(new Date());
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      setError('Unable to reach the Solar Microgrid API on port 5298.');
      toast.error('The reservation ledger could not be refreshed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(() => {
      fetchReservationsAndStats();
    }, 0);

    return () => window.clearTimeout(initialSync);
  }, [fetchReservationsAndStats]);

  const handleStatusUpdate = async (id, status, actionEndpoint) => {
    setLoadingId(id);

    try {
      await api.put('/reservations/' + id + '/' + actionEndpoint);
      toast.success('Reservation ' + status.toLowerCase() + '.', {
        icon: status === 'Approved'
          ? <CircleCheck className="h-5 w-5 text-emerald-500" />
          : <CircleX className="h-5 w-5 text-red-400" />,
      });
      await fetchReservationsAndStats();
    } catch (updateError) {
      const message = updateError.response?.data?.message || 'Failed to update reservation status.';
      console.error('Update error:', updateError);
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = (id) => handleStatusUpdate(id, 'Approved', 'approve');
  const handleReject = (id) => handleStatusUpdate(id, 'Rejected', 'reject');

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation? This will remove it from the active dispatch plan.')) {
      return;
    }

    setLoadingId(id);

    try {
      await api.put('/reservations/' + id + '/cancel', { reason: 'Operator cancelled upon request' });
      toast.success('Reservation cancelled.');
      await fetchReservationsAndStats();
    } catch (cancelError) {
      const message = cancelError.response?.data?.message || 'Cancellation failed.';
      toast.error(message, { duration: 5000 });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = useMemo(() => reservations.filter((reservation) => {
    const reservationStatus = reservation.status ?? 'Pending';
    const matchesFilter = filter === 'All'
      || String(reservationStatus).toLowerCase() === filter.toLowerCase();
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) return matchesFilter;

    const prosumer = String(
      reservation.prosumerNic ?? reservation.prosumerId ?? reservation.consumerId ?? ''
    ).toLowerCase();
    const node = String(reservation.nodeId ?? reservation.microgridNodeId ?? '').toLowerCase();
    const id = String(reservation.id ?? reservation.reservationId ?? '').toLowerCase();

    return matchesFilter && (
      prosumer.includes(searchTerm)
      || node.includes(searchTerm)
      || id.includes(searchTerm)
    );
  }), [filter, reservations, search]);

  const counts = {
    All: reservations.length,
    Pending: Number(stats.pending) || 0,
    Approved: Number(stats.approved) || 0,
    Cancelled: Number(stats.cancelled) || 0,
    Rejected: Number(stats.rejected) || 0,
  };

  const total = Math.max(Number(stats.total) || reservations.length || 0, 1);
  const closed = (Number(stats.rejected) || 0) + (Number(stats.cancelled) || 0);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date());

  return (
    <div className="operations-shell">
      <header className="operations-topbar">
        <Link to="/reservations" className="operations-brand" aria-label="Solar grid reservation ledger">
          <span className="operations-brand-mark"><SunMedium /></span>
          <span>
            <strong>Solis microgrid</strong>
            <small>Grid operator / station 01</small>
          </span>
        </Link>

        <nav className="operations-nav" aria-label="Operator sections">
          <Link to="/reservations" className="is-current">Reservations</Link>
          <Link to="/nodes">Solar nodes</Link>
          <Link to="/scan">Verify pass</Link>
          {isAdmin && (
            <Link to="/admin/approvals">Prosumer approvals</Link>
          )}
        </nav>

        <div className="operations-topbar-actions">
          <div className={'operations-connection' + (error ? ' is-offline' : '')}>
            <i />
            <span>{error ? 'API offline' : 'Live (5298)'}</span>
          </div>

          {user ? (
            <div className="operations-user-pill">
              <div className="user-avatar-tag">
                {user.email ? user.email[0].toUpperCase() : <User className="w-3 h-3" />}
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

      <main className="operations-workspace">
        <section className="operations-hero">
          <div className="operations-heading">
            <div className="section-coordinate">
              <span>01</span>
              <p>Reservation control</p>
            </div>
            <h1>
              Dispatch <em>ledger.</em>
            </h1>
            <p className="operations-intro">
              Review incoming energy requests, clear valid reservations, and keep every solar dispatch traceable.
            </p>
            <div className="operations-heading-actions">
              <button
                type="button"
                onClick={fetchReservationsAndStats}
                disabled={loading}
                className="sync-control"
              >
                <RefreshCw className={loading ? 'is-spinning' : ''} />
                {loading ? 'Syncing ledger' : 'Sync ledger'}
              </button>
              <span>
                {lastSyncedAt
                  ? 'Last sync ' + lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : dateLabel}
              </span>
            </div>
          </div>

          <GridFlow
            pending={Number(stats.pending) || 0}
            approved={Number(stats.approved) || 0}
            error={error}
            loading={loading}
          />
        </section>

<section className="telemetry-rail" aria-label="Reservation telemetry">
          <MetricCell
            index={0}
            label="Awaiting decision"
            value={Number(stats.pending) || 0}
            note="needs operator review"
            ratio={((Number(stats.pending) || 0) / total) * 100}
            tone="solar"
            loading={loading}
            priority
          />
          <MetricCell
            index={1}
            label="All bookings"
            value={Number(stats.total) || 0}
            note="in the ledger"
            ratio={100}
            loading={loading}
          />
          <MetricCell
            index={2}
            label="Approved"
            value={Number(stats.approved) || 0}
            note="cleared to dispatch"
            ratio={((Number(stats.approved) || 0) / total) * 100}
            tone="positive"
            loading={loading}
          />
          <MetricCell
            index={3}
            label="Scheduled ahead"
            value={Number(stats.approvedFutureReservations) || 0}
            note="future windows"
            ratio={((Number(stats.approvedFutureReservations) || 0) / total) * 100}
            tone="cool"
            loading={loading}
          />
          <MetricCell
            index={4}
            label="Closed without dispatch"
            value={closed}
            note="cancelled or rejected"
            ratio={(closed / total) * 100}
            tone="negative"
            loading={loading}
          />
        </section>

        <section className="dispatch-ledger">
          <div className="ledger-heading-row">
            <div className="ledger-heading-copy">
              <div className="section-coordinate">
                <span>02</span>
                <p>Live request book</p>
              </div>
              <h2>Reservation queue</h2>
              <p>{filtered.length} of {reservations.length} records visible</p>
            </div>

            <div className="ledger-tools">
              <label className="ledger-search">
                <Search aria-hidden="true" />
                <span className="sr-only">Search reservations</span>
                <input
                  type="search"
                  placeholder="Find NIC, node or reference"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                    <X aria-hidden="true" />
                  </button>
                )}
              </label>

              <div className="ledger-shortcuts">
                <Link to="/nodes">
                  <Network aria-hidden="true" />
                  Nodes
                </Link>
                <Link to="/scan" className="is-accent">
                  <ScanLine aria-hidden="true" />
                  Scan pass
                </Link>
              </div>
            </div>
          </div>

          <div className="ledger-filter-row">
            {FILTERS.map((filterName) => (
              <FilterTab
                key={filterName}
                label={filterName}
                active={filter === filterName}
                count={counts[filterName] ?? 0}
                onClick={() => setFilter(filterName)}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.32 }}
            className="ledger-table-wrap"
          >
            {error ? (
              <ErrorState message={error} onRetry={fetchReservationsAndStats} />
            ) : (
              <table className="reservation-ledger-table">
                <thead>
                  <tr>
                    {TABLE_HEADERS.map((header) => <th key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, index) => <SkeletonRow key={index} index={index} />)
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filtered.length === 0 ? (
                        <tr key="empty" className="ledger-empty-row">
                          <td colSpan={8}><EmptyState filter={filter} /></td>
                        </tr>
                      ) : (
                        filtered.map((reservation, index) => (
                          <ReservationRow
                            key={reservation.id ?? reservation.reservationId ?? index}
                            reservation={reservation}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onCancel={handleCancel}
                            onViewQr={setSelectedQrReservation}
                            loadingId={loadingId}
                            index={index}
                            userRole={user?.role}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            )}
          </motion.div>
        </section>
      </main>

      <AnimatePresence>
        {selectedQrReservation && (
          <QrModal
            reservation={selectedQrReservation}
            onClose={() => setSelectedQrReservation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
