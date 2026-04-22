const { useState } = React;

function Dashboard() {
    const [pins, setPins] = useState({});
    const [serialData, setSerialData] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [sensorHistory, setSensorHistory] = useState({
        temperature: [],
        humidity: [],
        timestamps: []
    });

    const { connected } = useWebSocketConnection();

    const onData = data => {
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
    }

    const onError = error => {
        console.error('WebSocket error:', error);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <WebSocketConnectionStatus onData={onData} onError={onError} />
            <BoardPinoutSection pins={pins} serialData={serialData} timestamp={timestamp} connected={connected} />
            <SensorsSection sensorHistory={sensorHistory} connected={connected} />
            <ChartsSection sensorHistory={sensorHistory} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
