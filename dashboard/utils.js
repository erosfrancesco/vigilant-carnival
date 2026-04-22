// Utility functions for the dashboard

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

function getGPIOLabel(pin) {
    const labels = {
        '17': 'GPIO 17',
        '27': 'GPIO 27',
        '22': 'GPIO 22',
        '23': 'GPIO 23'
    };
    return labels[pin] || `GPIO ${pin}`;
}

// Make them global
window.getServerUrl = getServerUrl;
window.getGPIOLabel = getGPIOLabel;


// Custom hook for WebSocket connection management
function useWebSocketConnection() {
    const [connected, setConnected] = React.useState(false);
    const [serverUrl, setServerUrl] = React.useState(window.getServerUrl());
    const [tempUrl, setTempUrl] = React.useState(window.getServerUrl());
    const [showConfig, setShowConfig] = React.useState(false);
    const [error, setError] = React.useState('');
    const ws = React.useRef(null);

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
                        return data;
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

    React.useEffect(() => {
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [serverUrl]);

    return {
        connected,
        serverUrl,
        tempUrl,
        showConfig,
        error,
        ws,
        connectWebSocket,
        handleConnect,
        handlePersistent,
        handleReset,
        setTempUrl,
        setShowConfig,
        setError,
        setPins: null, // Will be handled by parent
        setSerialData: null, // Will be handled by parent
        setTimestamp: null, // Will be handled by parent
    };
}
