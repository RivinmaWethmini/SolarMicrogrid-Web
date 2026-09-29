import { motion } from 'framer-motion';
import {
  Users,
  Sun,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NavigationHeader from '../components/NavigationHeader';

export default function BackofficeDashboard() {
  return (
    <main className="backoffice-page min-h-screen">
      <NavigationHeader subtitle="Backoffice Operations" />

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="backoffice-icon">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <span className="backoffice-badge">
              BACKOFFICE
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            Backoffice Portal
          </h1>

          <p className="mt-2">
            Smart Solar Microgrid · Administration & Management Center
          </p>
        </motion.div>


        {/* Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backoffice-status mb-8"
        >
          <span className="status-dot-live" />
          <span>System Online</span>

          <span className="status-divider" />

          <span>Administration Portal</span>
        </motion.div>


        {/* Management Cards */}
        <div className="grid gap-5 md:grid-cols-2">

          {/* Prosumer Management */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backoffice-module-card"
          >
            <div className="backoffice-module-icon yellow">
              <Users className="h-6 w-6" />
            </div>

            <div className="mt-5">
              <span className="module-label">
                USER MANAGEMENT
              </span>

              <h2>
                Prosumer Management
              </h2>

              <p>
                Register, update, deactivate and reactivate
                prosumer profiles.
              </p>
            </div>

            <Link
              to="/prosumers"
              className="backoffice-open-btn"
            >
              Open Management
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>


          {/* Solar Node Management */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backoffice-module-card"
          >
            <div className="backoffice-module-icon green">
              <Sun className="h-6 w-6" />
            </div>

            <div className="mt-5">
              <span className="module-label">
                INFRASTRUCTURE
              </span>

              <h2>
                Solar Node Management
              </h2>

              <p>
                Manage and monitor the microgrid solar
                generation nodes.
              </p>
            </div>

            <Link
              to="/nodes"
              className="backoffice-open-btn"
            >
              Open Management
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

        </div>


        {/* Grid Operator Portal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="backoffice-operator-card mt-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="backoffice-module-icon dark">
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <span className="module-label">
                  OPERATIONS
                </span>

                <h2>
                  Grid Operator Portal
                </h2>

                <p>
                  Reservations, energy slot approvals and
                  dispatch operations.
                </p>
              </div>

            </div>

            <Link
              to="/reservations"
              className="backoffice-outline-btn"
            >
              Open Operator Portal
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </motion.div>

      </div>

    </main>
  );
}