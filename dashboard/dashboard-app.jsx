const { useState } = React;

function Dashboard() {
    const [pins, setPins] = useState({});
    const [serialData, setSerialData] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [sensorHistory, setSensorHistory] = useState({
        timestamps: []
    });

    const { connected } = useWebSocketConnection();

    const onData = data => {
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
                setSensorHistory((prev) => {
                    const timestamps = [...prev.timestamps, data.timestamp].slice(-60);

                    const sensors = Object.keys(data.sensors);
                    const values = sensors.reduce((acc, sensor) => {
                        const { value, ...props } = data.sensors[sensor];
                        acc[sensor] = prev[sensor] || {
                            ...props,
                            value: []
                        };

                        acc[sensor].value = [...acc[sensor].value, value].slice(-60);

                        return acc;
                    }, {});

                    return {
                        ...values,
                        timestamps
                    };
                })
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
            {/** */}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
