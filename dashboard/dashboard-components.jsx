const { useEffect, useRef } = React;

function GPIOPinsDisplay({ pins, timestamp }) {
    return (
        <>
            {Object.entries(pins).map(([pin, state]) => (
                <div key={pin} className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                    <div className="text-sm text-gray-600 uppercase tracking-wide mb-3">{window.getGPIOLabel(pin)}</div>
                    <div className={`w-15 h-15 rounded-full mx-auto my-3 shadow-md ${state ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}></div>
                    <div className={`text-3xl font-bold my-4 min-h-15 flex items-center justify-center ${state ? 'text-green-500' : 'text-red-500'}`}>{state ? 'HIGH' : 'LOW'}</div>
                    <div className="text-sm text-gray-500 mt-3">{timestamp}</div>
                </div>
            ))}
        </>
    );
}

function SerialDataDisplay({ serialData, timestamp }) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-full">
            <div className="text-lg font-semibold text-gray-800 mb-4">📡 Serial Data</div>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 font-mono max-h-48 overflow-y-auto text-gray-800 text-sm leading-relaxed break-all whitespace-pre-wrap">{serialData || <span className="text-gray-500 italic">No data received...</span>}</div>
            <div className="text-sm text-gray-500 mt-3">{timestamp}</div>
        </div>
    );
}

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

function LineChartWidget({
    label, data, timestamps,
    color = '#667eea',
    yMin, yMax, yLabel = ''
}) {
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
                // responsive: true,
                animation: false, // 🔥 realtime feel
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

function InputField({ label, onChange, children, className, ...props }) {
    const thisClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg " +
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-black" +
        (className ? ' ' + className : '');

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                className={thisClasses}
                onChange={e => onChange(e.target.value)}
                {...props}
            />
            {children}
        </div>
    );
}