const { useEffect, useRef, useState } = React;

function ValueDisplay({ label, value, unit, min, max, avg }) {
    return (
        <div className="widget value-display">
            <div className="value-label">{label}</div>
            <div className="value-number">{value.toFixed(2)}</div>
            {unit && <div className="value-unit">{unit}</div>}
            {(min !== undefined || max !== undefined || avg !== undefined) && (
                <div className="value-stats">
                    {min !== undefined && (
                        <div className="stat">
                            <div className="stat-label">Min</div>
                            <div className="stat-value">{min.toFixed(1)}</div>
                        </div>
                    )}
                    {avg !== undefined && (
                        <div className="stat">
                            <div className="stat-label">Avg</div>
                            <div className="stat-value">{avg.toFixed(1)}</div>
                        </div>
                    )}
                    {max !== undefined && (
                        <div className="stat">
                            <div className="stat-label">Max</div>
                            <div className="stat-value">{max.toFixed(1)}</div>
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
        <div className="widget">
            <div className="chart-title">{label}</div>
            {data.length > 0 ? (
                <div className="chart-container">
                    <canvas ref={canvasRef}></canvas>
                </div>
            ) : (
                <div className="no-data">Aguardando dados...</div>
            )}
            <div className="chart-info">
                {data.length > 0 && `${data.length} pontos registrados`}
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
            <div className="widget-section">
                <div className="widget-title">📊 Sensores e Dados</div>
                <div className="widgets-grid">
                    <ValueDisplay
                        label="Temperatura"
                        value={currentTemp}
                        unit="°C"
                        min={tempStats.min}
                        max={tempStats.max}
                        avg={tempStats.avg}
                    />
                    <ValueDisplay
                        label="Umidade"
                        value={currentHum}
                        unit="%"
                        min={humStats.min}
                        max={humStats.max}
                        avg={humStats.avg}
                    />
                </div>
            </div>
            <div className="widget-section">
                <div className="widget-title">📈 Gráficos</div>
                <div className="widgets-grid">
                    <LineChartWidget
                        label="Temperatura (Últimos 60s)"
                        data={sensorHistory.temperature}
                        timestamps={sensorHistory.timestamps}
                        color="#667eea"
                        yMin={15}
                        yMax={30}
                        yLabel="°C"
                    />
                    <LineChartWidget
                        label="Umidade (Últimos 60s)"
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
