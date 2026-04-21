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