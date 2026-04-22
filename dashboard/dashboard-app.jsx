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
        console.log('data', data)
        if (data.type === 'init' || data.type === 'state') {
            if ('gpio' in data) {
                setPins(data.gpio);
            }

            if ('serial' in data) {
                setSerialData(data.serial);
            }

            if (data.timestamp) {
                setTimestamp(new Date(data.timestamp).toLocaleTimeString());
            }

            if (data.sensors) {
                setSensorHistory(prev => ({
                    temperature: [...prev.temperature, data.sensors.temperature].slice(-60),
                    humidity: [...prev.humidity, data.sensors.humidity].slice(-60),
                    timestamps: [...prev.timestamps, data.timestamp].slice(-60)
                }));
            }
        }
    }

    const onError = error => {
        console.error('WebSocket error:', error);
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <ConnectionSection onData={onData} onError={onError} />
            <BoardPinoutSection pins={pins} serialData={serialData} timestamp={timestamp} connected={connected} />
            <SensorsSection sensorHistory={sensorHistory} connected={connected} />
            <ChartsSection sensorHistory={sensorHistory} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
