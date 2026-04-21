"""
Server configuration
"""

# WebSocket Settings
WS_HOST = "0.0.0.0"        # Listen on all interfaces
WS_PORT = 8765             # Default WebSocket port

# GPIO Settings
GPIO_PINS = [17, 27, 22, 23]  # BCM pin numbers to monitor

# Serial Settings
SERIAL_DEVICE = "/dev/ttyACM0"  # Serial port device
SERIAL_BAUDRATE = 9600

# Update interval in seconds
UPDATE_INTERVAL = 1.0

# Logging
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
