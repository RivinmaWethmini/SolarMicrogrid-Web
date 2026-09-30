import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Sun,
  ShieldCheck,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NavigationHeader from '../components/NavigationHeader';
import { authApi } from '../services/api';
import { getNodes } from '../services/nodeApi';

export default function BackofficeDashboard() {
  const [stats, setStats] = useState({
    totalProsumers: 4,
    activeProsumers: 4,
    pendingProsumers: 0,
    totalNodes: 5,
    activeNodes: 5,
    totalReservations: 9,
    pendingReservations: 5,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [adminStatsRes, nodesRes] = await Promise.allSettled([
        authApi.getAdminStats(),
        getNodes(),
      ]);

      let newStats = { ...stats };

      if (adminStatsRes.status === 'fulfilled' && adminStatsRes.value) {
        const d = adminStatsRes.value;
        newStats.totalProsumers = d.totalProsumers ?? newStats.totalProsumers;
        newStats.pendingProsumers = d.pendingProsumers ?? newStats.pendingProsumers;
        newStats.activeProsumers = d.approvedProsumers ?? newStats.activeProsumers;
        newStats.totalReservations = d.totalReservations ?? newStats.totalReservations;
        newStats.pendingReservations = d.pendingReservations ?? newStats.pendingReservations;
      }

      if (nodesRes.status === 'fulfilled' && Array.isArray(nodesRes.value?.data)) {
        const nList = nodesRes.value.data;
        newStats.totalNodes = nList.length;
        newStats.activeNodes = nList.filter(
          (n) => String(n.status).toLowerCase() === 'active'
        ).length;
      }

      setStats(newStats);
    } catch {
      // Fallback preserves initial nominal values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="operations-shell">
      <NavigationHeader subtitle="Backoffice administration" />

      <main className="operations-workspace node-workspace">
        {/* Unified Hero Section */}
        <section className="node-hero" aria-labelledby="backoffice-title">
          <div className="operations-heading node-heading">
            <div className="section-coordinate">
              <span>00</span>
              <p>Governance / Central Command</p>
            </div>

            <h1 id="backoffice-title">
              Backoffice <em>console.</em>
            </h1>

            <p className="operations-intro">
              Central administration and infrastructure governance portal. Supervise prosumer registries, calibrate solar generation nodes, and authorize KYC dispatch rights.
            </p>
          </div>

          <aside className="node-hero-console" aria-label="System status console">
            <span className="node-console-index">Central Dispatch Authority</span>
            <div className="node-console-status">
              <i aria-hidden="true" />
              Grid link online · Substation 01
            </div>
            <p>Direct encrypted telemetry feed synchronized with central controller.</p>

            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="sync-control node-refresh-control"
            >
              <RefreshCw className={loading ? 'is-spinning' : ''} />
              {loading ? 'Synchronizing' : 'Synchronize telemetry'}
            </button>
          </aside>
        </section>

        {/* Telemetry Metrics Rail */}
        <section className="node-metrics" aria-label="Microgrid telemetry overview">
          <article className="node-metric">
            <div className="node-metric-head">
              <span>01 / Prosumers</span>
              <Users aria-hidden="true" />
            </div>
            <strong>{stats.totalProsumers}</strong>
            <p>{stats.activeProsumers} verified solar producers</p>
          </article>

          <article className="node-metric is-positive">
            <div className="node-metric-head">
              <span>02 / Infrastructure</span>
              <Sun aria-hidden="true" />
            </div>
            <strong>{stats.totalNodes}</strong>
            <p>{stats.activeNodes} active solar generation hubs</p>
          </article>

          <article className="node-metric">
            <div className="node-metric-head">
              <span>03 / Verification</span>
              <ShieldCheck aria-hidden="true" />
            </div>
            <strong style={{ color: stats.pendingProsumers > 0 ? 'var(--ops-solar)' : 'inherit' }}>
              {stats.pendingProsumers}
            </strong>
            <p>{stats.pendingProsumers > 0 ? 'Pending operator review' : 'All dossiers cleared'}</p>
          </article>

          <article className="node-metric is-muted">
            <div className="node-metric-head">
              <span>04 / Ledger</span>
              <CalendarDays aria-hidden="true" />
            </div>
            <strong>{stats.totalReservations}</strong>
            <p>{stats.pendingReservations} awaiting dispatch</p>
          </article>
        </section>

        {/* Tactical Governance Modules Grid */}
        <section className="mt-10" aria-label="Backoffice operation suites">
          <div className="node-ledger-heading mb-6">
            <div>
              <span>Core Operational Units</span>
              <h2>Administrative Suites</h2>
              <p>Direct navigation to primary microgrid management and governance instruments.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Module 1: Prosumer Management */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="node-panel flex flex-col justify-between"
              style={{ minHeight: '260px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="section-coordinate">
                    <span>01</span>
                    <p>USER MANAGEMENT</p>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--ops-line-strong)',
                      backgroundColor: 'rgba(233, 248, 91, 0.06)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ops-solar)',
                    }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-normal text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Prosumer Registry
                </h3>
                <p className="text-sm text-[#b1b5ac] leading-relaxed mb-6">
                  Register, calibrate hardware specifications, activate tariffs, and manage distributed solar energy prosumer profiles across grid clusters.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--ops-line)] flex items-center justify-between">
                <span className="text-xs text-[#8c9288] font-mono">
                  {stats.totalProsumers} registered prosumers
                </span>
                <Link
                  to="/prosumers"
                  className="sync-control"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}
                >
                  Open Registry
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>

            {/* Module 2: Solar Node Registry */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="node-panel flex flex-col justify-between"
              style={{ minHeight: '260px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="section-coordinate">
                    <span>02</span>
                    <p>INFRASTRUCTURE</p>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--ops-line-strong)',
                      backgroundColor: 'rgba(57, 255, 126, 0.06)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ops-positive)',
                    }}
                  >
                    <Sun className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-normal text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Solar Node Management
                </h3>
                <p className="text-sm text-[#b1b5ac] leading-relaxed mb-6">
                  Monitor high-voltage microgrid generation hubs, configure substation battery capacity slots, coordinates, and operating schedules.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--ops-line)] flex items-center justify-between">
                <span className="text-xs text-[#8c9288] font-mono">
                  {stats.totalNodes} connected hubs
                </span>
                <Link
                  to="/nodes"
                  className="sync-control"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}
                >
                  Open Hubs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>

            {/* Module 3: KYC Prosumer Approvals */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="node-panel flex flex-col justify-between"
              style={{ minHeight: '260px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="section-coordinate">
                    <span>03</span>
                    <p>SECURITY & KYC</p>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--ops-line-strong)',
                      backgroundColor: 'rgba(255, 208, 0, 0.08)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#FFD000',
                    }}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-normal text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Prosumer KYC Approvals
                </h3>
                <p className="text-sm text-[#b1b5ac] leading-relaxed mb-6">
                  Authorize newly registered prosumer applications, audit national identity cards (NIC), verify compliance, and enable live peer trading access.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--ops-line)] flex items-center justify-between">
                <span className="text-xs text-[#8c9288] font-mono">
                  {stats.pendingProsumers} dossiers pending
                </span>
                <Link
                  to="/admin/prosumers"
                  className="sync-control"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}
                >
                  Review Dossiers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>

            {/* Module 4: Grid Operator Portal */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="node-panel flex flex-col justify-between"
              style={{ minHeight: '260px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="section-coordinate">
                    <span>04</span>
                    <p>OPERATIONS</p>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--ops-line-strong)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ops-text)',
                    }}
                  >
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-normal text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Energy Dispatch Ledger
                </h3>
                <p className="text-sm text-[#b1b5ac] leading-relaxed mb-6">
                  Oversee live energy slot reservations, clear prosumer injection queues, audit cryptographic QR passes, and maintain grid stability.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--ops-line)] flex items-center justify-between">
                <span className="text-xs text-[#8c9288] font-mono">
                  {stats.totalReservations} ledger bookings
                </span>
                <Link
                  to="/reservations"
                  className="sync-control"
                  style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}
                >
                  Open Ledger
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}