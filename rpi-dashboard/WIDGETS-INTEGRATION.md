/*
 * WIDGETS INTEGRATION EXAMPLE
 * 
 * This file shows how to properly wire real WebSocket sensor data
 * to the dashboard widgets for real-time visualization.
 * 
 * Copy these patterns into your dashboard HTML file.
 */

// ============================================================================
// STEP 1: Initialize WebSocket Connection
// ============================================================================

let ws = null;
const serverUrl = getServerUrl();  // Uses modal configuration

function connectWebSocket() {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(serverUrl);
        
        ws.onopen = () => {
            console.log('✅ Connected to', serverUrl);
            resolve();
        };
        
        ws.onerror = (error) => {
            console.error('❌ Connection error:', error);
            reject(error);
        };
        
        ws.onclose = () => {
            console.log('⚠️  Disconnected from server');
            // Attempt reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onmessage = handleServerMessage;
    });
}


// ============================================================================
// STEP 2: Handle Server Messages and Update State
// ============================================================================

// State variables to store sensor history
const sensorHistory = {
    temperature: [],
    humidity: [],
    pressure: [],
    timestamps: [],
    currentValues: {
        temperature: null,
        humidity: null,
        pressure: null
    },
    statistics: {
        temperature: { min: null, max: null, avg: null },
        humidity: { min: null, max: null, avg: null },
        pressure: { min: null, max: null, avg: null }
    }
};

function handleServerMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'state') {
            // Extract sensor data from server message
            const timestamp = data.timestamp;
            
            // Process temperature
            if (data.sensors?.temperature !== undefined) {
                const temp = data.sensors.temperature;
                sensorHistory.temperature.push(temp);
                sensorHistory.currentValues.temperature = temp;
                updateStatistics('temperature');
            }
            
            // Process humidity
            if (data.sensors?.humidity !== undefined) {
                const humidity = data.sensors.humidity;
                sensorHistory.humidity.push(humidity);
                sensorHistory.currentValues.humidity = humidity;
                updateStatistics('humidity');
            }
            
            // Process pressure
            if (data.sensors?.pressure !== undefined) {
                const pressure = data.sensors.pressure;
                sensorHistory.pressure.push(pressure);
                sensorHistory.currentValues.pressure = pressure;
                updateStatistics('pressure');
            }
            
            // Add timestamp
            sensorHistory.timestamps.push(timestamp);
            
            // Keep only last 60 values (prevent memory growth)
            if (sensorHistory.temperature.length > 60) {
                sensorHistory.temperature.shift();
                sensorHistory.humidity.shift();
                sensorHistory.pressure.shift();
                sensorHistory.timestamps.shift();
            }
            
            // Update UI with new data
            updateDashboardWidgets();
        }
        
        // Handle other message types as needed
        if (data.type === 'sensors') {
            console.log('Sensor reading:', data.data);
        }
        
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}


// ============================================================================
// STEP 3: Calculate Statistics for Value Display Widgets
// ============================================================================

function updateStatistics(sensorName) {
    const history = sensorHistory[sensorName];
    
    if (history.length === 0) {
        sensorHistory.statistics[sensorName] = {
            min: null,
            max: null,
            avg: null
        };
        return;
    }
    
    const min = Math.min(...history);
    const max = Math.max(...history);
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    
    sensorHistory.statistics[sensorName] = {
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        avg: parseFloat(avg.toFixed(2))
    };
}

function getStatistics(sensorName) {
    return sensorHistory.statistics[sensorName] || { min: null, max: null, avg: null };
}


// ============================================================================
// STEP 4: Update Widget Props with Real Data
// ============================================================================

function updateDashboardWidgets() {
    // Update Temperature Widget
    updateValueDisplay('temp-display', {
        label: 'Temperature',
        value: sensorHistory.currentValues.temperature,
        unit: '°C',
        ...getStatistics('temperature')
    });
    
    // Update Temperature Chart
    updateLineChart('temp-chart', {
        label: 'Temperature (Last 60s)',
        data: sensorHistory.temperature,
        timestamps: sensorHistory.timestamps,
        color: '#667eea',
        yMin: 15,
        yMax: 30,
        yLabel: '°C'
    });
    
    // Update Humidity Widget
    updateValueDisplay('humidity-display', {
        label: 'Humidity',
        value: sensorHistory.currentValues.humidity,
        unit: '%',
        ...getStatistics('humidity')
    });
    
    // Update Humidity Chart
    updateLineChart('humidity-chart', {
        label: 'Humidity (Last 60s)',
        data: sensorHistory.humidity,
        timestamps: sensorHistory.timestamps,
        color: '#764ba2',
        yMin: 30,
        yMax: 90,
        yLabel: '%'
    });
    
    // Update Pressure Widget
    updateValueDisplay('pressure-display', {
        label: 'Pressure',
        value: sensorHistory.currentValues.pressure,
        unit: 'hPa',
        ...getStatistics('pressure')
    });
}


// ============================================================================
// STEP 5: Helper Functions to Update Widget DOM
// ============================================================================

/**
 * Updates a value display widget with new data
 * @param {string} elementId - ID of the widget container
 * @param {object} data - Widget data {label, value, unit, min, max, avg}
 */
function updateValueDisplay(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const stats = data;
    
    element.innerHTML = `
        <div class="value-display">
            <div class="value-label">${stats.label}</div>
            <div class="value-number">${stats.value?.toFixed(1) || '—'} ${stats.unit || ''}</div>
            <div class="value-stats">
                <div class="stat">
                    <span class="label">Min</span>
                    <span class="value">${stats.min?.toFixed(1) || '—'}</span>
                </div>
                <div class="stat">
                    <span class="label">Avg</span>
                    <span class="value">${stats.avg?.toFixed(1) || '—'}</span>
                </div>
                <div class="stat">
                    <span class="label">Max</span>
                    <span class="value">${stats.max?.toFixed(1) || '—'}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Updates a line chart widget with new data
 * @param {string} elementId - ID of canvas element
 * @param {object} data - Chart data {label, data, timestamps, color, yMin, yMax, yLabel}
 */
function updateLineChart(elementId, data) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;
    
    // Destroy existing chart if exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    // Format timestamps to HH:MM:SS
    const labels = data.timestamps.map(ts => {
        const date = new Date(ts);
        return date.toLocaleTimeString();
    });
    
    // Limit labels to avoid crowding (show every 10th)
    const displayLabels = labels.map((label, idx) => {
        return idx % 10 === 0 ? label : '';
    });
    
    // Create chart instance
    canvas.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                label: data.label,
                data: data.data,
                borderColor: data.color,
                backgroundColor: data.color + '20',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.3,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = data.label || '';
                            if (label) label += ': ';
                            label += context.parsed.y.toFixed(2);
                            if (data.yLabel) label += ' ' + data.yLabel;
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: data.yMin || undefined,
                    max: data.yMax || undefined,
                    ticks: {
                        callback: function(value) {
                            return value + (data.yLabel ? data.yLabel : '');
                        }
                    }
                },
                x: {
                    display: true
                }
            }
        }
    });
}


// ============================================================================
// STEP 6: Initialize on Page Load
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Create widget containers if they don't exist
    createWidgetContainers();
    
    // Connect to server
    connectWebSocket().catch(error => {
        console.error('Failed to connect:', error);
        document.getElementById('status').textContent = '❌ Connection Failed';
    });
});

function createWidgetContainers() {
    const html = `
        <div class="widget-section">
            <div class="widget-title">📊 Sensor Data</div>
            <div class="widgets-grid">
                <div id="temp-display" class="widget"></div>
                <div id="humidity-display" class="widget"></div>
                <div id="pressure-display" class="widget"></div>
            </div>
        </div>
        
        <div class="widget-section">
            <div class="widget-title">📈 Historical Data</div>
            <div class="widgets-grid">
                <div class="chart-container">
                    <div class="chart-title">Temperature</div>
                    <canvas id="temp-chart"></canvas>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Humidity</div>
                    <canvas id="humidity-chart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Append to main content area
    const sidebar = document.querySelector('.gpio-grid');
    if (sidebar) {
        sidebar.insertAdjacentHTML('afterend', html);
    }
}


// ============================================================================
// STEP 7: Advanced - Custom Sensor Types
// ============================================================================

/**
 * Example: Adding a distance sensor (HC-SR04)
 * 
 * In your server, add:
 *   "distance": 25.5  # in cm
 * 
 * Then in handleServerMessage():
 */

function handleDistanceSensor(distanceValue, timestamp) {
    if (!sensorHistory.distance) {
        sensorHistory.distance = [];
        sensorHistory.currentValues.distance = null;
        sensorHistory.statistics.distance = { min: null, max: null, avg: null };
    }
    
    sensorHistory.distance.push(distanceValue);
    sensorHistory.currentValues.distance = distanceValue;
    updateStatistics('distance');
    
    if (sensorHistory.distance.length > 60) {
        sensorHistory.distance.shift();
    }
}


// ============================================================================
// STEP 8: Debugging - Monitor Messages
// ============================================================================

function enableDebugMode() {
    const originalOnMessage = ws.onmessage;
    
    ws.onmessage = (event) => {
        console.log('📨 Server message:', event.data);
        originalOnMessage.call(ws, event);
    };
    
    console.log('🔍 Debug mode enabled - messages logged to console');
}

// Call in browser console: enableDebugMode()
