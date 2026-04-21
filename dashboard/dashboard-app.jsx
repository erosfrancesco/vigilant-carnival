const { useState, useEffect, useRef } = React;

function getServerUrl() {
    const stored = sessionStorage.getItem('ws_server_url');
    if (stored) return stored;

    const persistent = localStorage.getItem('ws_server_url_persistent');
    if (persistent) return persistent;

    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get('server');
    if (paramUrl) return paramUrl;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:8765`;
}

function Dashboard() {
    const [connected, setConnected] = useState(false);
    const [pins, setPins] = useState({});
    const [serialData, setSerialData] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [error, setError] = useState('');
    const [serverUrl, setServerUrl] = useState(getServerUrl());
    const [tempUrl, setTempUrl] = useState(serverUrl);
    const [showConfig, setShowConfig] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [serverUrl]);

    function connectWebSocket() {
        try {
            ws.current = new WebSocket(serverUrl);

            ws.current.onopen = () => {
                console.log('Connected to WebSocket server');
                setConnected(true);
                setError('');
            };

            ws.current.onmessage = event => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'init' || data.type === 'state') {
                        if (data.gpio) {
                            setPins(data.gpio);
                        }
                        if (data.serial) {
                            setSerialData(data.serial);
                        }
                        if (data.timestamp) {
                            setTimestamp(new Date(data.timestamp).toLocaleTimeString());
                        }
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };

            ws.current.onerror = error => {
                console.error('WebSocket error:', error);
                setError('Connection error - check server address');
            };

            ws.current.onclose = () => {
                console.log('Disconnected from WebSocket server');
                setConnected(false);
                setTimeout(() => connectWebSocket(), 3000);
            };
        } catch (e) {
            setError(`Failed to connect: ${e.message}`);
            setTimeout(() => connectWebSocket(), 3000);
        }
    }

    function handleConnect() {
        if (!tempUrl.trim()) return;
        sessionStorage.setItem('ws_server_url', tempUrl.trim());
        setServerUrl(tempUrl.trim());
        setShowConfig(false);
    }

    function handlePersistent() {
        if (!tempUrl.trim()) return;
        localStorage.setItem('ws_server_url_persistent', tempUrl.trim());
        sessionStorage.setItem('ws_server_url', tempUrl.trim());
        setServerUrl(tempUrl.trim());
        setShowConfig(false);
    }

    function handleReset() {
        sessionStorage.removeItem('ws_server_url');
        localStorage.removeItem('ws_server_url_persistent');

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const defaultUrl = `${protocol}//${window.location.hostname}:8765`;
        setTempUrl(defaultUrl);
        setServerUrl(defaultUrl);
        setShowConfig(false);
    }

    function getGPIOLabel(pin) {
        const labels = {
            '17': 'GPIO 17',
            '27': 'GPIO 27',
            '22': 'GPIO 22',
            '23': 'GPIO 23'
        };
        return labels[pin] || `GPIO ${pin}`;
    }

    return (
        <>
            <div className="container">
                <div className="header">
                    <h1>🎛️ Raspberry Pi Dashboard</h1>
                    <div className="status">
                        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></div>
                        <span>{connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                {error && <div className="error">{error}</div>}

                <div className="grid">
                    {Object.entries(pins).map(([pin, state]) => (
                        <div key={pin} className="card pin-card">
                            <div className="pin-label">{getGPIOLabel(pin)}</div>
                            <div className={`pin-indicator ${state ? 'high' : 'low'}`}></div>
                            <div className={`pin-state ${state ? 'high' : 'low'}`}>{state ? 'HIGH' : 'LOW'}</div>
                            <div className="timestamp">{timestamp}</div>
                        </div>
                    ))}

                    <div className="card serial-card">
                        <div className="serial-title">📡 Serial Data</div>
                        <div className="serial-data">{serialData}</div>
                        <div className="timestamp">{timestamp}</div>
                    </div>
                </div>
            </div>

            <DashboardWithWidgets connected={connected} />

            <div className="server-url-display" onClick={() => setShowConfig(true)}>
                🔧 {serverUrl}
            </div>

            {showConfig && (
                <div className="config-overlay" onClick={e => e.target === e.currentTarget && setShowConfig(false)}>
                    <div className="config-modal">
                        <h2>Server Configuration</h2>
                        <div className="config-group">
                            <label htmlFor="server-url">WebSocket Server URL</label>
                            <input
                                id="server-url"
                                type="text"
                                value={tempUrl}
                                onChange={e => setTempUrl(e.target.value)}
                                placeholder="ws://192.168.1.100:8765"
                            />
                            <div className="config-help">Format: ws://HOST:PORT or wss://HOST:PORT (SSL)</div>
                        </div>
                        <div className="config-group">
                            <label>Current Connection</label>
                            <div className="config-help">
                                Status: {connected ? '✅ Connected' : '❌ Disconnected'}
                                <br />
                                URL: {serverUrl}
                            </div>
                        </div>
                        <div className="config-buttons">
                            <button className="btn-connect" onClick={handleConnect}>Connect (Session)</button>
                            <button className="btn-connect" onClick={handlePersistent} style={{ backgroundColor: '#16a34a' }}>
                                Save & Connect
                            </button>
                            <button className="btn-reset" onClick={handleReset}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
