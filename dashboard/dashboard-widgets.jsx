const { useEffect, useRef, useState } = React;

// Ensure global functions are available
const getGPIOLabel = window.getGPIOLabel || (() => 'GPIO');

function ValueDisplay({ label, value, unit, min, max, avg }) {
    return (
        <div className="bg-white rounded-lg p-5 shadow-lg text-center">
            <div className="text-sm text-gray-600 uppercase tracking-wider mb-4">{label}</div>
            <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{value.toFixed(2)}</div>
            {unit && <div className="text-lg text-gray-500 mt-1">{unit}</div>}
            {(min !== undefined || max !== undefined || avg !== undefined) && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
                    {min !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase mb-1">Min</div>
                            <div className="text-xl font-bold text-gray-800">{min.toFixed(1)}</div>
                        </div>
                    )}
                    {avg !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase mb-1">Avg</div>
                            <div className="text-xl font-bold text-gray-800">{avg.toFixed(1)}</div>
                        </div>
                    )}
                    {max !== undefined && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 uppercase mb-1">Max</div>
                            <div className="text-xl font-bold text-gray-800">{max.toFixed(1)}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LineChartWidget({ label, data, timestamps, color = '#667eea', yMin, yMax, yLabel = '' }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || data.length === 0) return;

        const ctx = canvasRef.current.getContext('2d');

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps.map(t => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
                datasets: [{
                    label,
                    data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: yMin,
                        max: yMax,
                        ticks: {
                            callback: value => value + (yLabel ? ' ' + yLabel : '')
                        }
                    },
                    x: {
                        display: true,
                        ticks: { maxTicksLimit: 6 }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, timestamps, label, color, yMin, yMax, yLabel]);

    return (
        <div className="bg-white rounded-lg p-5 shadow-lg">
            <div className="text-lg font-semibold text-gray-800 mb-2">{label}</div>
            {data.length > 0 ? (
                <div className="relative h-64 mb-2">
                    <canvas ref={canvasRef}></canvas>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10 italic">Waiting for data...</div>
            )}
            <div className="text-sm text-gray-600 text-center">
                {data.length > 0 && `${data.length} data points recorded`}
            </div>
        </div>
    );
}

function DashboardWithWidgets({ connected }) {
    const [sensorHistory, setSensorHistory] = useState({
        temperature: [],
        humidity: [],
        timestamps: []
    });

    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(() => {
            const temp = 20 + Math.sin(Date.now() / 10000) * 5 + Math.random() * 2;
            const hum = 60 + Math.cos(Date.now() / 15000) * 15 + Math.random() * 5;

            setSensorHistory(prev => ({
                temperature: [...prev.temperature, temp].slice(-60),
                humidity: [...prev.humidity, hum].slice(-60),
                timestamps: [...prev.timestamps, new Date().toISOString()].slice(-60)
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, [connected]);

    const calcStats = data => {
        if (data.length === 0) return { min: 0, max: 0, avg: 0 };
        return {
            min: Math.min(...data),
            max: Math.max(...data),
            avg: data.reduce((a, b) => a + b, 0) / data.length
        };
    };

    const tempStats = calcStats(sensorHistory.temperature);
    const humStats = calcStats(sensorHistory.humidity);
    const currentTemp = sensorHistory.temperature[sensorHistory.temperature.length - 1] || 0;
    const currentHum = sensorHistory.humidity[sensorHistory.humidity.length - 1] || 0;

    return (
        <>
            <div className="mb-8">
                <div className="text-white text-2xl mb-4 font-semibold uppercase tracking-wide">📊 Sensors & Data</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                </div>
            </div>
            <div className="mb-8">
                <div className="text-white text-2xl mb-4 font-semibold uppercase tracking-wide">📈 Charts</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                </div>
            </div>
        </>
    );
}
