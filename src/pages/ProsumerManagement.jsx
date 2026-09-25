import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RefreshCw,
  LoaderCircle,
  X,
  Users,
  Zap,
  BatteryCharging,
  ArrowLeft,
} from 'lucide-react';

import ProsumerRow from '../components/ProsumerRow';
import {
  getProsumers,
  deactivateProsumer,
  reactivateProsumer,
} from '../services/prosumerApi';

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.title) {
    return data.title;
  }

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }

  return fallback;
}

export default function ProsumerManagement() {
  const [prosumers, setProsumers] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProsumers();
  }, []);

  async function fetchProsumers(showLoader = true) {
    if (showLoader) {
      setIsLoadingList(true);
    }

    try {
      const response = await getProsumers();

      setProsumers(response.data?.value || response.data || []);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not load prosumers. Please check the API connection.'
        )
      );
    } finally {
      if (showLoader) {
        setIsLoadingList(false);
      }
    }
  }

  function clearMessages() {
    setErrorMsg('');
    setSuccessMsg('');
  }

  async function handleDeactivate(nic) {
    clearMessages();
    setLoadingId(nic);

    try {
      await deactivateProsumer(nic);
      setSuccessMsg('Prosumer deactivated successfully.');
      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not deactivate the prosumer.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReactivate(nic) {
    clearMessages();
    setLoadingId(nic);

    try {
      await reactivateProsumer(nic);
      setSuccessMsg('Prosumer reactivated successfully.');
      await fetchProsumers(false);
    } catch (error) {
      setErrorMsg(
        getErrorMessage(
          error,
          'Could not reactivate the prosumer.'
        )
      );
    } finally {
      setLoadingId(null);
    }
  }

  function handleEdit(prosumer) {
    console.log('Edit prosumer:', prosumer);
  }

  const activeCount = prosumers.filter(
    (prosumer) => prosumer.isAvailable === true
  ).length;

  const inactiveCount = prosumers.length - activeCount;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              to="/reservations"
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>

            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              <Users className="h-3.5 w-3.5" />
              Backoffice
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Prosumer Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register, update and control prosumer profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchProsumers()}
            disabled={isLoadingList}
            className="secondary-btn"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingList ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="summary-label">
                Total Prosumers
              </span>
            </div>

            <strong className="summary-number text-slate-900">
              {prosumers.length}
            </strong>
          </div>

          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="summary-label">
                Active Prosumers
              </span>
            </div>

            <strong className="summary-number text-emerald-600">
              {activeCount}
            </strong>
          </div>

          <div className="summary-card">
            <div className="mb-1 flex items-center gap-2">
              <BatteryCharging className="h-4 w-4 text-slate-500" />
              <span className="summary-label">
                Inactive Prosumers
              </span>
            </div>

            <strong className="summary-number text-slate-500">
              {inactiveCount}
            </strong>
          </div>
        </section>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="alert-error"
            >
              <span>{errorMsg}</span>

              <button
                type="button"
                onClick={() => setErrorMsg('')}
                aria-label="Close error message"
                className="flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="alert-success"
            >
              <span>{successMsg}</span>

              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                aria-label="Close success message"
                className="flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prosumer table */}
        <section className="node-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              Registered Prosumers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {prosumers.length} prosumer
              {prosumers.length === 1 ? '' : 's'} registered
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-bold text-slate-500">
                  <th className="px-5 py-4">NIC</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Solar</th>
                  <th className="px-5 py-4">Battery</th>
                  <th className="px-5 py-4">Available Energy</th>
                  <th className="px-5 py-4">Price / kWh</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {isLoadingList ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                          <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" />
                          Loading prosumers
                        </div>
                      </td>
                    </tr>
                  ) : prosumers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        No prosumers have been registered.
                      </td>
                    </tr>
                  ) : (
                    prosumers.map((prosumer, index) => (
                      <ProsumerRow
                        key={prosumer.nic}
                        prosumer={prosumer}
                        index={index}
                        loadingId={loadingId}
                        onEdit={handleEdit}
                        onDeactivate={handleDeactivate}
                        onReactivate={handleReactivate}
                      />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}