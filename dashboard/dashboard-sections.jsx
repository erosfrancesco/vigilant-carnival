const { useEffect } = React;

// TODO: - Should use labeled sensors instead of hardcoded temperature/humidity
function SensorsSection({ sensorHistory }) {
    const tempStats = window.calcStats(sensorHistory.temperature);
    const humStats = window.calcStats(sensorHistory.humidity);
    const currentTemp = sensorHistory.temperature[sensorHistory.temperature.length - 1] || 0;
    const currentHum = sensorHistory.humidity[sensorHistory.humidity.length - 1] || 0;

    return (
        <div className="mb-8">
            <SectionTitle>📊 Sensors & Data</SectionTitle>
            <SectionLayout>
                <ValueDisplay
                    label="Temperature"
                    value={currentTemp}
                    unit="°C"
                    min={tempStats.min}
                    max={tempStats.max}
                    avg={tempStats.avg}
                />
                <ValueDisplay
                    label="Humidity"
                    value={currentHum}
                    unit="%"
                    min={humStats.min}
                    max={humStats.max}
                    avg={humStats.avg}
                />
            </SectionLayout>
        </div>
    );
}

function ChartsSection({ sensorHistory }) {
    return (
        <div className="mb-8">
            <SectionTitle>📈 Charts</SectionTitle>
            <SectionLayout>
                <LineChartWidget
                    label="Temperature (Last 60s)"
                    data={sensorHistory.temperature}
                    timestamps={sensorHistory.timestamps}
                    color="#667eea"
                    yMin={15}
                    yMax={30}
                    yLabel="°C"
                />
                <LineChartWidget
                    label="Humidity (Last 60s)"
                    data={sensorHistory.humidity}
                    timestamps={sensorHistory.timestamps}
                    color="#764ba2"
                    yMin={30}
                    yMax={90}
                    yLabel="%"
                />
            </SectionLayout>
        </div>
    );
}

function BoardPinoutSection({ pins, serialData, timestamp, connected }) {
    // TODO: - In case is not connected, show a message instead of the pinout
    return <div className="mb-8">
        <SectionTitle>🔌 GPIO & Serial</SectionTitle>
        <SectionLayout>
            <GPIOPinsDisplay pins={pins} timestamp={timestamp} />
            <SerialDataDisplay serialData={serialData} timestamp={timestamp} />
        </SectionLayout>
    </div>
}


// Connection (WebSocket) status and configuration component
function ConnectionSection({ onData, onError }) {
    const {
        connected,
        serverUrl,
        showConfig,
        setShowConfig,
        ws
    } = useWebSocketConnection();

    useEffect(() => {
        if (!ws.current) return;

        ws.current.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                onData(data);
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };

        ws.current.onerror = error => {
            console.error('WebSocket error:', error);
            onError(error);
        };
    }, [ws]); // Re-run effect if WebSocket instance changes

    return <div className="text-white mb-8 text-center">
        <h1 className="text-5xl mb-3">🎛️ Raspberry Pi Dashboard</h1>
        <div className="flex items-center justify-center gap-3 text-lg">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <div className="fixed bottom-5 right-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm font-mono cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => setShowConfig(true)}>
            🔧 {serverUrl}
        </div>

        {showConfig && <ConnectionOptions onClose={() => setShowConfig(false)} />}
    </div>
}

function ConnectionOptions({ onClose }) {
    const {
        connected,
        serverUrl,
        tempUrl,
        setTempUrl,
        showConfig,
        setShowConfig,
        handleConnect,
        handlePersistent,
        handleReset
    } = useWebSocketConnection();

    const handleButtonClick = (action) => {
        console.log('Executing action and closing config:', showConfig);
        action();
        onClose();
    }

    return <div className="text-black fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowConfig(false)}>
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
                <button className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors" onClick={() => handleButtonClick(handleConnect)}>Connect (Session)</button>
                <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors" onClick={() => handleButtonClick(handlePersistent)}>
                    Save & Connect
                </button>
                <button className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors" onClick={() => handleButtonClick(handleReset)}>Reset</button>
                <button className="flex-1 py-2 px-4 bg-red-200 text-gray-800 rounded-lg font-semibold hover:bg-red-300 transition-colors" onClick={() => handleButtonClick(onClose)}>Close</button>
            </div>
        </div>
    </div>
}


//
function SectionTitle({ children }) {
    return <div className="text-white text-2xl mb-4 font-semibold uppercase tracking-wide">
        {children}
    </div>
}

function SectionLayout({ children }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {children}
    </div>
}