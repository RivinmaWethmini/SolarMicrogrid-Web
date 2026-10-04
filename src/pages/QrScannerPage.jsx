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
  Upload,
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
  const [fileScanning, setFileScanning] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Handle QR image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileScanning(true);
      setCameraError('');
      setResult(null);

      const qrRegionId = 'qr-reader-viewport';
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        await qrCode.stop();
        setScanning(false);
      }
      const decodedText = await qrCode.scanFile(file, false);
      await handleVerifyPayload(decodedText);
    } catch (fileErr) {
      console.error('File scan error:', fileErr);
      setCameraError(
        'No valid prosumer QR pass detected in this image. Please ensure the code is clear or use the Manual payload tab.'
      );
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Initialize and start camera scanner with device detection and fallback
  const startCamera = async () => {
    try {
      setCameraError('');
      setResult(null);

      // Clean up previous instance cleanly
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (cleanupErr) {
          console.warn('Scanner cleanup warning:', cleanupErr);
        }
        html5QrCodeRef.current = null;
      }

      const qrRegionId = 'qr-reader-viewport';
      const container = document.getElementById(qrRegionId);
      if (!container) {
        return;
      }

      const qrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = qrCode;

      // Detect available cameras on this computer/device
      let selectedCamera = null;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // If a rear / back camera exists (e.g. tablet/phone), prefer it;
          // otherwise pick the primary webcam on laptops/desktops.
          const rear = cameras.find((cam) =>
            /back|rear|environment|world/i.test(cam.label)
          );
          selectedCamera = rear ? rear.id : cameras[0].id;
        }
      } catch (enumErr) {
        console.warn('Camera enumeration error, trying constraints:', enumErr);
      }

      const scanConfig = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      const onScanSuccess = async (decodedText) => {
        try {
          if (html5QrCodeRef.current?.isScanning) {
            await html5QrCodeRef.current.pause(true);
          }
        } catch (e) {
          console.warn('Scanner pause error:', e);
        }
        setScanning(false);
        await handleVerifyPayload(decodedText);
      };

      const onScanFailure = () => {
        // Frame parse error (ignore frame-by-frame scanner noise)
      };

      if (selectedCamera) {
        try {
          await qrCode.start(selectedCamera, scanConfig, onScanSuccess, onScanFailure);
        } catch (camIdErr) {
          console.warn('Failed starting camera by ID, trying fallback facingMode:', camIdErr);
          await qrCode.start({ facingMode: 'user' }, scanConfig, onScanSuccess, onScanFailure);
        }
      } else {
        // Fallback sequence: 'user' first (standard for laptop webcams), then 'environment'
        try {
          await qrCode.start({ facingMode: 'user' }, scanConfig, onScanSuccess, onScanFailure);
        } catch {
          await qrCode.start({ facingMode: 'environment' }, scanConfig, onScanSuccess, onScanFailure);
        }
      }

      setScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error('Camera access error:', err);
      const name = err?.name || '';
      const msg = err?.message || String(err);

      if (
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('denied')
      ) {
        setCameraError(
          'Camera access was blocked by your browser. Click the lock/camera icon in your address bar (left of localhost:5173), choose "Allow", and click "Start camera".'
        );
      } else if (
        name === 'NotFoundError' ||
        name === 'DevicesNotFoundError' ||
        msg.toLowerCase().includes('not found')
      ) {
        setCameraError(
          'No camera device was detected on your computer. Please connect a webcam or use the "Upload pass image" button below.'
        );
      } else if (
        name === 'NotReadableError' ||
        name === 'TrackStartError' ||
        msg.toLowerCase().includes('source')
      ) {
        setCameraError(
          'Your camera is currently in use by another application (like Windows Camera, Teams, or Zoom). Please close it and click "Start camera" again.'
        );
      } else {
        setCameraError(
          `Unable to access camera (${name || 'Error'}: ${msg}). You can also upload a QR pass image or paste the raw JSON in Manual payload.`
        );
      }
      setScanning(false);
      setScannerReady(false);
    }
  };

  // Stop camera stream safely
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Camera stop error:', err);
    } finally {
      html5QrCodeRef.current = null;
      setScanning(false);
      setScannerReady(false);
    }
  };

  // Stop camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCamera();
    }
  }, [activeTab]);

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
                <dt>System</dt>
                <dd>Ready</dd>
              </div>
              <div>
                <dt>Scanner</dt>
                <dd>{scanning ? 'Camera active' : scannerReady ? 'Camera paused' : 'Standby'}</dd>
              </div>
              <div>
                <dt>Pass Type</dt>
                <dd>Energy Transfer</dd>
              </div>
            </dl>
            <span className={'qr-station-link' + (cameraError ? ' is-error' : '')}>
              <i aria-hidden="true" />
              {cameraError ? 'Camera interrupted' : 'Scanner ready'}
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
                    {!scanning && !loading && !fileScanning && (
                      <div className="qr-standby-overlay">
                        <Camera className="qr-standby-icon" aria-hidden="true" />
                        <p>Scanner standby</p>
                        <span>Click &quot;Start camera&quot; or upload an image to scan</span>
                      </div>
                    )}
                    {(loading || fileScanning) && (
                      <div className="qr-loading-overlay" aria-live="polite">
                        <LoaderCircle className="is-spinning" aria-hidden="true" />
                        <p>{fileScanning ? 'Analyzing pass image...' : 'Verifying with SolarAPI...'}</p>
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
                  <div className="qr-camera-actions">
                    <button
                      type="button"
                      onClick={scanning ? stopCamera : startCamera}
                      className="qr-control-button"
                    >
                      <Camera aria-hidden="true" />
                      {scanning ? 'Pause camera' : 'Start camera'}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fileScanning || loading}
                      className="qr-control-button qr-control-button-secondary"
                    >
                      <Upload aria-hidden="true" />
                      {fileScanning ? 'Analyzing pass...' : 'Upload pass image'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
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
        </section>
      </main>
    </div>
  );
}
