import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  CircleCheck,
  CircleX,
  Zap,
  Network,
  User,
  CalendarDays,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import NavigationHeader from '../components/NavigationHeader';

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
    <div className="operations-shell qr-page">
      <NavigationHeader subtitle="Verification station 01" />

      <main className="operations-workspace qr-workspace">
        <section className="qr-hero" aria-labelledby="qr-page-title">
          <div className="qr-hero-copy">
            <div className="section-coordinate">
              <span>03</span>
              <p>Station verification</p>
            </div>
            <h1 id="qr-page-title">
              Verify <em>dispatch.</em>
            </h1>
            <p>
              Read a prosumer&apos;s cryptographic pass, validate it against the grid controller,
              and authorize each energy transfer from one inspection terminal.
            </p>
          </div>

          <aside className="qr-station-panel" aria-label="Verification terminal status">
            <div className="qr-station-panel-head">
              <div>
                <span>Verification terminal</span>
                <h2>WEB / STATION 01</h2>
              </div>
              <ShieldCheck aria-hidden="true" />
            </div>
            <dl className="qr-station-readings">
              <div>
                <dt>Controller</dt>
                <dd>SolarAPI / QR verify</dd>
              </div>
              <div>
                <dt>Scanner</dt>
                <dd>{scanning ? 'Camera live' : scannerReady ? 'Camera paused' : 'Camera standby'}</dd>
              </div>
              <div>
                <dt>Protocol</dt>
                <dd>Encrypted dispatch pass</dd>
              </div>
            </dl>
            <span className={'qr-station-link' + (cameraError ? ' is-error' : '')}>
              <i aria-hidden="true" />
              {cameraError ? 'Camera link interrupted' : 'Verification controller online'}
            </span>
          </aside>
        </section>

        <section className="qr-console" aria-labelledby="qr-console-title">
          <header className="qr-console-head">
            <div>
              <span>Live instrument / 01</span>
              <h2 id="qr-console-title">Dispatch pass reader</h2>
            </div>
            <span
              className={`qr-console-state ${
                loading
                  ? 'is-loading'
                  : result
                    ? result.success ? 'is-success' : 'is-error'
                    : scanning ? 'is-live' : 'is-idle'
              }`}
            >
              <i aria-hidden="true" />
              {loading
                ? 'Validating pass'
                : result
                  ? result.success ? 'Authorized' : 'Rejected'
                  : scanning ? 'Camera live' : 'Ready'}
            </span>
          </header>

          <div className="qr-mode-tabs" role="tablist" aria-label="Verification input method">
            <button
              type="button"
              role="tab"
              id="qr-camera-tab"
              aria-selected={activeTab === 'camera'}
              aria-controls="qr-camera-panel"
              onClick={() => setActiveTab('camera')}
              className={'qr-mode-tab' + (activeTab === 'camera' ? ' is-active' : '')}
            >
              <Camera aria-hidden="true" />
              <span>Live camera</span>
              <small>Optical scan</small>
            </button>
            <button
              type="button"
              role="tab"
              id="qr-manual-tab"
              aria-selected={activeTab === 'manual'}
              aria-controls="qr-manual-panel"
              onClick={() => setActiveTab('manual')}
              className={'qr-mode-tab' + (activeTab === 'manual' ? ' is-active' : '')}
            >
              <Layers aria-hidden="true" />
              <span>Manual payload</span>
              <small>JSON input</small>
            </button>
          </div>

          <div className="qr-console-body">
            {activeTab === 'camera' && !result && (
              <div
                id="qr-camera-panel"
                className="qr-camera-panel"
                role="tabpanel"
                aria-labelledby="qr-camera-tab"
              >
                <div className="qr-camera-instrument">
                  <div className="qr-camera-frame">
                    <span className="qr-corner qr-corner-one" aria-hidden="true" />
                    <span className="qr-corner qr-corner-two" aria-hidden="true" />
                    <span className="qr-corner qr-corner-three" aria-hidden="true" />
                    <span className="qr-corner qr-corner-four" aria-hidden="true" />
                    <div id="qr-reader-viewport" className="qr-reader-viewport" />
                    {loading && (
                      <div className="qr-loading-overlay" aria-live="polite">
                        <LoaderCircle className="is-spinning" aria-hidden="true" />
                        <p>Verifying with SolarAPI...</p>
                      </div>
                    )}
                  </div>
                  <div className="qr-camera-caption">
                    <span>Camera aperture</span>
                    <p>Align the complete dispatch code inside the target frame.</p>
                  </div>
                </div>

                <div className="qr-camera-controls">
                  <div className="qr-camera-guidance">
                    <span>Scan procedure</span>
                    <ol>
                      <li>Present the approved prosumer pass.</li>
                      <li>Hold the code steady inside the frame.</li>
                      <li>Wait for controller authorization.</li>
                    </ol>
                  </div>
                  <button
                    type="button"
                    onClick={scanning ? stopCamera : startCamera}
                    className="qr-control-button"
                  >
                    <Camera aria-hidden="true" />
                    {scanning ? 'Pause camera' : 'Start camera'}
                  </button>
                </div>

                {cameraError && (
                  <div className="qr-alert qr-alert-error" role="alert">
                    <AlertTriangle aria-hidden="true" />
                    <div>
                      <strong>Camera link unavailable</strong>
                      <p>{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && !result && (
              <div
                id="qr-manual-panel"
                className="qr-manual-panel"
                role="tabpanel"
                aria-labelledby="qr-manual-tab"
              >
                <div className="qr-manual-copy">
                  <span>Fallback channel</span>
                  <h3>Inspect a raw payload</h3>
                  <p>
                    Paste the complete JSON payload exactly as issued. The controller will apply
                    the same reservation and replay checks used by the live scanner.
                  </p>
                </div>
                <label className="qr-payload-field">
                  <span>Raw scanned QR JSON payload</span>
                  <textarea
                    rows={7}
                    value={manualPayload}
                    onChange={(e) => setManualPayload(e.target.value)}
                    placeholder='{"reservationId":"...","prosumerId":"...","nodeId":"...","status":"Approved","securityToken":"..."}'
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleVerifyPayload(manualPayload)}
                  disabled={loading || !manualPayload.trim()}
                  className="qr-primary-button"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="is-spinning" aria-hidden="true" />
                      Verifying payload
                    </>
                  ) : (
                    <>
                      <ShieldCheck aria-hidden="true" />
                      Verify payload
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <article
                className={'qr-result ' + (result.success ? 'is-success' : 'is-error')}
                aria-live="polite"
              >
                <header className="qr-result-head">
                  <span className="qr-result-mark" aria-hidden="true">
                    {result.success ? <CircleCheck /> : <CircleX />}
                  </span>
                  <div>
                    <span className="qr-result-kicker">
                      {result.success ? 'Dispatch authorized' : 'Verification failed'}
                    </span>
                    <h3>
                      {result.success
                        ? 'Energy transfer approved'
                        : 'Dispatch denied by server'}
                    </h3>
                  </div>
                  <strong>{result.success ? 'PASS' : 'DENY'}</strong>
                </header>

                <p className="qr-result-message">
                  {result.success ? result.data.message : result.message}
                </p>

                {result.success && result.data && (
                  <dl className="qr-result-grid">
                    <div>
                      <dt><User aria-hidden="true" />Prosumer NIC</dt>
                      <dd>{result.data.prosumerId}</dd>
                    </div>
                    <div>
                      <dt><Network aria-hidden="true" />Microgrid node</dt>
                      <dd>{result.data.nodeId}</dd>
                    </div>
                    <div>
                      <dt><Zap aria-hidden="true" />Authorized energy</dt>
                      <dd>{result.data.reservedEnergyKwh} kWh</dd>
                    </div>
                    <div>
                      <dt><CalendarDays aria-hidden="true" />Dispatched at</dt>
                      <dd>
                        {result.data.dispatchedAt
                          ? new Date(result.data.dispatchedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Just now'}
                      </dd>
                    </div>
                  </dl>
                )}

                <div className="qr-result-actions">
                  <button type="button" onClick={resetAndScanNext} className="qr-primary-button">
                    <RefreshCw aria-hidden="true" />
                    Scan next QR code
                  </button>
                  <Link to="/reservations" className="qr-secondary-link">
                    Return to ledger
                  </Link>
                </div>
              </article>
            )}
          </div>

          <footer className="qr-console-foot">
            <span><i aria-hidden="true" />Controller channel encrypted</span>
            <span>POST /api/qr/verify</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
