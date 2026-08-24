import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Calendar, User, Zap, Check, X, Loader2 } from 'lucide-react';
import emptyStateSvg from '../assets/images/empty-state.svg';

const API_BASE = 'http://localhost:5298/api/Reservation';

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!document.getElementById('outfit-font')) {
      const link = document.createElement('link');
      link.id = 'outfit-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(API_BASE);
      const pending = res.data.filter(r => r.status === 'Pending' || !r.status);
      setReservations(pending);
    } catch (err) {
      setError('Unable to fetch reservations. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id);
      const endpoint = \\/\/\\;
      await axios.put(endpoint);
      setReservations(prev => prev.filter(res => res.id !== id));
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-slate-50 text-slate-800 p-6 md:p-10 transition-all duration-700"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Two-Column Hero Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white p-8 md:p-14 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-semibold tracking-wide shadow-sm">
              <Leaf className="w-4 h-4" />
              Eco-Tech Grid
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Reservation <br/>
              <span className="text-emerald-500">Management</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md font-normal">
              Review and orchestrate pending energy requests across the solar microgrid. Ensure sustainable distribution for all prosumers.
            </p>
          </div>
          <div className="flex-1 w-full flex justify-end">
             {/* Asymmetrical "Leaf" shaped image placeholder */}
             <div className="relative w-full max-w-[420px] aspect-[4/3] bg-emerald-100 rounded-tl-none rounded-tr-[120px] rounded-br-none rounded-bl-[120px] overflow-hidden shadow-[0_20px_40px_rgb(16,185,129,0.15)] border-[6px] border-white">
                <img 
                  src="../assets/images/solar-panel.jpg"
                  alt="Solar Panel" 
                  className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-[1500ms] ease-out"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800';
                  }}
                />
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-12">
          
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pending Requests</h2>
            <span className="bg-slate-50 border border-slate-100 text-slate-600 px-5 py-2 rounded-full text-sm font-bold shadow-sm">
              {reservations.length} Queue
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-emerald-500">
               <Loader2 className="w-12 h-12 animate-spin mb-4" />
               <p className="text-slate-500 font-medium tracking-wide">Loading grid data...</p>
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <X className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{error}</h3>
              <button 
                onClick={fetchReservations}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all shadow-sm"
              >
                Try Again
              </button>
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-center">
              <img src={emptyStateSvg} alt="No data" className="w-56 mb-8 opacity-80" />
              <h3 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">You're All Caught Up!</h3>
              <p className="text-slate-500 text-lg max-w-md">There are no pending reservations in the queue. The grid is operating at peak efficiency.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-5 font-semibold text-slate-400 text-sm tracking-wide">Prosumer NIC</th>
                    <th className="pb-5 font-semibold text-slate-400 text-sm tracking-wide">Node ID</th>
                    <th className="pb-5 font-semibold text-slate-400 text-sm tracking-wide">Schedule</th>
                    <th className="pb-5 font-semibold text-slate-400 text-sm tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {reservations.map((res) => (
                      <motion.tr
                        key={res.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                        transition={{ duration: 0.4 }}
                        className="group border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-6 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                              <User className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-800 text-base">{res.prosumerId || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-6 pr-4">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold shadow-sm">
                            <Zap className="w-4 h-4 text-emerald-500" />
                            {res.nodeId || res.microgridNodeId || 'N/A'}
                          </span>
                        </td>
                        <td className="py-6 pr-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(res.startTime).toLocaleDateString()}
                            </span>
                            <span className="text-sm font-medium text-slate-500 mt-1 ml-6">
                              {new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(res.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleAction(res.id, 'approve')}
                              disabled={actionLoading === res.id}
                              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 hover:-translate-y-0.5"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(res.id, 'cancel')}
                              disabled={actionLoading === res.id}
                              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm transition-all disabled:opacity-50 hover:-translate-y-0.5"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
