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
            <div className="max-w-4xl mx-auto">
                <div className="text-white mb-8 text-center">
                    <h1 className="text-5xl mb-3">🎛️ Raspberry Pi Dashboard</h1>
                    <div className="flex items-center justify-center gap-3 text-lg">
                        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                        <span>{connected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-5">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(pins).map(([pin, state]) => (
                        <div key={pin} className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                            <div className="text-sm text-gray-600 uppercase tracking-wide mb-3">{getGPIOLabel(pin)}</div>
                            <div className={`w-15 h-15 rounded-full mx-auto my-3 shadow-md ${state ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}></div>
                            <div className={`text-3xl font-bold my-4 min-h-15 flex items-center justify-center ${state ? 'text-green-500' : 'text-red-500'}`}>{state ? 'HIGH' : 'LOW'}</div>
                            <div className="text-sm text-gray-500 mt-3">{timestamp}</div>
                        </div>
                    ))}

                    <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-full">
                        <div className="text-lg font-semibold text-gray-800 mb-4">📡 Serial Data</div>
                        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 font-mono max-h-48 overflow-y-auto text-gray-800 text-sm leading-relaxed break-all whitespace-pre-wrap">{serialData || <span className="text-gray-500 italic">No data received...</span>}</div>
                        <div className="text-sm text-gray-500 mt-3">{timestamp}</div>
                    </div>
                </div>
            </div>

            <DashboardWithWidgets connected={connected} />

            <div className="fixed bottom-5 right-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm font-mono cursor-pointer opacity-60 hover:opacity-100 transition-opacity" onClick={() => setShowConfig(true)}>
                🔧 {serverUrl}
            </div>

            {showConfig && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowConfig(false)}>
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Server Configuration</h2>
                        <div className="mb-6">
                            <label htmlFor="server-url" className="block text-sm font-medium text-gray-700 mb-2">WebSocket Server URL</label>
                            <input
                                id="server-url"
                                type="text"
                                value={tempUrl}
                                onChange={e => setTempUrl(e.target.value)}
                                placeholder="ws://192.168.1.100:8765"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            />
                            <div className="text-sm text-gray-600 mt-1">Format: ws://HOST:PORT or wss://HOST:PORT (SSL)</div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Connection</label>
                            <div className="text-sm text-gray-600 mt-1">
                                Status: {connected ? '✅ Connected' : '❌ Disconnected'}
                                <br />
                                URL: {serverUrl}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors" onClick={handleConnect}>Connect (Session)</button>
                            <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors" onClick={handlePersistent}>
                                Save & Connect
                            </button>
                            <button className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors" onClick={handleReset}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
