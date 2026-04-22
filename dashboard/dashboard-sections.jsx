const calcStats = data => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0 };
    return {
        min: Math.min(...data),
        max: Math.max(...data),
        avg: data.reduce((a, b) => a + b, 0) / data.length
    };
};

// TODO: - Should use labeled sensors instead of hardcoded temperature/humidity
function SensorsSection({ sensorHistory }) {
    const tempStats = calcStats(sensorHistory.temperature);
    const humStats = calcStats(sensorHistory.humidity);
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