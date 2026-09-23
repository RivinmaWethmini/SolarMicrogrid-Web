import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Cpu, 
  User, 
  Calendar,
  Layers
} from 'lucide-react';
import api from '../services/api';

/**
 * React Web Operator QR Dispatch Scanner
 * Scans prosumer QR pass via web browser camera, validates cryptographic token
 * against SolarAPI (POST /api/qr/verify), and displays dispatch authorization.
 * 
 * Author: Member 4 (Energy Reservation & QR Dispatch)
 */
export default function QrScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualPayload, setManualPayload] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  
  const html5QrCodeRef = useRef(null);

  // Initialize and start camera scanner
  const startCamera = async () => {
    try {
      setCameraError('');
      setResult(null);
      
      const qrRegionId = 'qr-reader-viewport';
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        await qrCode.stop();
      }

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Success callback on valid QR decode
          try {
            await qrCode.pause(true);
          } catch (e) {
            console.warn('Scanner pause error', e);
          }
          setScanning(false);
          await handleVerifyPayload(decodedText);
        },
        (errorMessage) => {
          // Frame parse error (ignore frame-by-frame scanner noise)
        }
      );

      setScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or use the Manual Verification tab.'
      );
      setScanning(false);
    }
  };

  // Stop camera stream safely
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.warn('Camera stop error:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Submit payload to SolarAPI endpoint
  const handleVerifyPayload = async (payloadString) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/qr/verify', {
        scannedPayload: payloadString.trim(),
        operatorId: 'WEB-OPERATOR-STATION-01',
      });

      setResult({
        success: true,
        data: response.data,
      });
    } catch (err) {
      const errData = err.response?.data;
      setResult({
        success: false,
        message: errData?.message || 'Verification rejected by Solar Microgrid server.',
        data: errData || null,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAndScanNext = async () => {
    setResult(null);
    setManualPayload('');
    if (activeTab === 'camera') {
      await startCamera();
    }
  };

  return (
    <div className="dashboard-container min-h-screen text-white bg-[#0A0A0C] flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b border-white/[0.08] bg-[#121316]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/reservations"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFD000]" />
              Operator QR Dispatch Verification
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Station Operator
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1 flex flex-col items-center">
        {/* Title and Instruction */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Verify Energy Dispatch Pass
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Scan a prosumer’s cryptographic QR pass to authorize energy transfer and prevent fraudulent or duplicate dispatches.
          </p>
        </div>

        {/* Tab Selector: Camera vs Manual Input */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#18191E] border border-white/10 mb-8">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'bg-[#FFD000] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera Scanner
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-[#FFD000] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Manual / Payload Input
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        {activeTab === 'camera' && !result && (
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[340px] rounded-3xl overflow-hidden border-2 border-[#FFD000]/50 bg-black shadow-[0_0_35px_rgba(255,208,0,0.15)] flex items-center justify-center">
              <div id="qr-reader-viewport" className="w-full h-full" />
              {loading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                  <RefreshCw className="w-8 h-8 text-[#FFD000] animate-spin" />
                  <p className="text-xs font-bold text-white tracking-wider uppercase">
                    Verifying with SolarAPI...
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 max-w-md">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={scanning ? stopCamera : startCamera}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-[#18191E] hover:bg-[#202128] text-slate-200 text-xs font-bold transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-[#FFD000]" />
                {scanning ? 'Pause Camera' : 'Start Camera'}
              </button>
            </div>
          </div>
        )}

        {/* Manual Payload Input Tab */}
        {activeTab === 'manual' && !result && (
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#18191E] border border-white/10 shadow-xl">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Raw Scanned QR JSON Payload
            </label>
            <textarea
              rows={5}
              value={manualPayload}
              onChange={(e) => setManualPayload(e.target.value)}
              placeholder='{"reservationId":"...","prosumerId":"...","nodeId":"...","status":"Approved","securityToken":"..."}'
              className="w-full rounded-2xl bg-black/50 border border-white/10 p-4 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#FFD000] transition-all"
            />
            <button
              onClick={() => handleVerifyPayload(manualPayload)}
              disabled={loading || !manualPayload.trim()}
              className="mt-4 w-full py-3 rounded-full bg-[#FFD000] hover:bg-[#FFE033] text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#FFD000]/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify Payload
                </>
              )}
            </button>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div
            className={`w-full max-w-lg p-8 rounded-3xl border transition-all ${
              result.success
                ? 'bg-[#10B981]/10 border-[#10B981]/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/40 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
            }`}
          >
            {/* Status Header */}
            <div className="flex items-center gap-3 mb-4">
              {result.success ? (
                <div className="w-12 h-12 rounded-2xl bg-[#10B981]/20 flex items-center justify-center text-[#10B981] border border-[#10B981]/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] border border-[#EF4444]/30">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <span
                  className={`text-xs font-black uppercase tracking-widest ${
                    result.success ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {result.success ? '✓ DISPATCH AUTHORIZED' : '✗ VERIFICATION FAILED'}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {result.success
                    ? 'Energy Transfer Approved'
                    : 'Dispatch Denied by Server'}
                </h3>
              </div>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-300 mb-6 bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed font-medium">
              {result.success ? result.data.message : result.message}
            </p>

            {/* Details List (On Success) */}
            {result.success && result.data && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <User className="w-3 h-3 text-[#FFD000]" />
                    Prosumer NIC
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {result.data.prosumerId}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Cpu className="w-3 h-3 text-[#FFD000]" />
                    Microgrid Node
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    {result.data.nodeId}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Zap className="w-3 h-3 text-[#FFD000]" />
                    Authorized Energy
                  </div>
                  <div className="text-sm font-bold text-[#FFD000]">
                    {result.data.reservedEnergyKwh} kWh
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Calendar className="w-3 h-3 text-[#FFD000]" />
                    Dispatched At
                  </div>
                  <div className="text-[11px] font-bold text-white">
                    {result.data.dispatchedAt
                      ? new Date(result.data.dispatchedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Just now'}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetAndScanNext}
                className="flex-1 py-3 rounded-full bg-[#FFD000] hover:bg-[#FFE033] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#FFD000]/15 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Next QR Code
              </button>
              <Link
                to="/reservations"
                className="px-5 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all text-center"
              >
                Done
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
