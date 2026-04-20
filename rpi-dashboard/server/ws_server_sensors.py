#!/usr/bin/env python3
"""
Enhanced WebSocket server with sensor data simulation
This server sends additional sensor data that can be displayed in dashboard widgets
"""
import asyncio
import json
import logging
import sys
import random
from datetime import datetime
from typing import Set

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("Error: websockets library not found. Install with: pip install websockets")
    sys.exit(1)

# Try to import RPi.GPIO, fallback to simulation if not on RPi
try:
    import RPi.GPIO as GPIO
    RPI_AVAILABLE = True
except (ImportError, RuntimeError):
    RPI_AVAILABLE = False
    print("Warning: RPi.GPIO not available, running in simulation mode")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
WS_HOST = "0.0.0.0"
WS_PORT = 8765
GPIO_PINS = [17, 27, 22, 23]
SERIAL_DEVICE = "/dev/ttyACM0"
UPDATE_INTERVAL = 1.0

# Global state
clients: Set[WebSocketServerProtocol] = set()
gpio_states = {}
serial_buffer = ""

# Sensor data storage
sensor_data = {
    "temperature": 20.0,
    "humidity": 60.0,
    "pressure": 1013.25,
}


def init_gpio():
    """Initialize GPIO pins for input"""
    if not RPI_AVAILABLE:
        logger.info("GPIO simulation mode - not initializing hardware")
        for pin in GPIO_PINS:
            gpio_states[pin] = False
        return
    
    try:
        GPIO.setmode(GPIO.BCM)
        for pin in GPIO_PINS:
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
            gpio_states[pin] = GPIO.input(pin)
        logger.info(f"GPIO initialized: {GPIO_PINS}")
    except Exception as e:
        logger.error(f"GPIO initialization error: {e}")


def read_gpio_states() -> dict:
    """Read current state of all GPIO pins"""
    states = {}
    for pin in GPIO_PINS:
        if RPI_AVAILABLE:
            try:
                states[pin] = bool(GPIO.input(pin))
            except Exception as e:
                logger.warning(f"Error reading pin {pin}: {e}")
                states[pin] = gpio_states.get(pin, False)
        else:
            states[pin] = gpio_states.get(pin, False)
    return states


def read_sensors() -> dict:
    """Read sensor data (replace with actual sensor reading)"""
    global sensor_data
    
    # Simulated sensor data with some variation
    # Replace these with actual sensor readings using libraries like:
    # - Adafruit_DHT for temperature/humidity
    # - adafruit_circuitpython_bmp280 for pressure
    # - etc.
    
    sensor_data["temperature"] = 20 + 5 * __import__('math').sin(__import__('time').time() / 10) + random.uniform(-0.5, 0.5)
    sensor_data["humidity"] = 60 + 15 * __import__('math').cos(__import__('time').time() / 15) + random.uniform(-2, 2)
    sensor_data["pressure"] = 1013.25 + random.uniform(-1, 1)
    
    return sensor_data.copy()


def read_serial() -> str | None:
    """Read data from serial port (non-blocking)"""
    try:
        import serial
        ser = serial.Serial(SERIAL_DEVICE, 9600, timeout=0.1)
        data = ser.read(100).decode('utf-8', errors='ignore')
        ser.close()
        return data if data else None
    except Exception as e:
        logger.debug(f"Serial read error: {e}")
        return None


async def broadcast_state():
    """Broadcast sensor state to all connected clients"""
    while True:
        try:
            await asyncio.sleep(UPDATE_INTERVAL)
            
            if not clients:
                continue
            
            # Read current state
            gpio_states = read_gpio_states()
            sensors = read_sensors()
            serial_data = read_serial()
            
            message = {
                "type": "state",
                "timestamp": datetime.now().isoformat(),
                "gpio": gpio_states,
                "sensors": {
                    "temperature": round(sensors["temperature"], 2),
                    "humidity": round(sensors["humidity"], 2),
                    "pressure": round(sensors["pressure"], 2),
                },
                "serial": serial_data,
            }
            
            # Broadcast to all connected clients
            disconnected = set()
            for client in clients:
                try:
                    await client.send(json.dumps(message))
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)
                except Exception as e:
                    logger.warning(f"Broadcast error: {e}")
                    disconnected.add(client)
            
            # Clean up disconnected clients
            for client in disconnected:
                clients.discard(client)
        
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await asyncio.sleep(1)


async def handle_client(websocket: WebSocketServerProtocol, path: str):
    """Handle new WebSocket client connection"""
    client_addr = websocket.remote_address
    clients.add(websocket)
    logger.info(f"Client connected: {client_addr} (total: {len(clients)})")
    
    try:
        # Send initial state
        gpio_states = read_gpio_states()
        sensors = read_sensors()
        
        message = {
            "type": "init",
            "timestamp": datetime.now().isoformat(),
            "gpio": gpio_states,
            "pins": GPIO_PINS,
            "sensors": {
                "temperature": round(sensors["temperature"], 2),
                "humidity": round(sensors["humidity"], 2),
                "pressure": round(sensors["pressure"], 2),
            },
        }
        await websocket.send(json.dumps(message))
        
        # Keep connection open and listen for client messages
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.debug(f"Message from {client_addr}: {data}")
                
                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                
                elif data.get("type") == "get_state":
                    gpio_states = read_gpio_states()
                    sensors = read_sensors()
                    response = {
                        "type": "state",
                        "timestamp": datetime.now().isoformat(),
                        "gpio": gpio_states,
                        "sensors": {
                            "temperature": round(sensors["temperature"], 2),
                            "humidity": round(sensors["humidity"], 2),
                            "pressure": round(sensors["pressure"], 2),
                        },
                    }
                    await websocket.send(json.dumps(response))
            
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {client_addr}")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
    
    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"Client error: {e}")
    finally:
        clients.discard(websocket)
        logger.info(f"Client disconnected: {client_addr} (total: {len(clients)})")


async def main():
    """Start WebSocket server"""
    init_gpio()
    
    # Start broadcast task
    broadcast_task = asyncio.create_task(broadcast_state())
    
    # Start WebSocket server
    async with websockets.serve(handle_client, WS_HOST, WS_PORT):
        logger.info(f"WebSocket server running on ws://{WS_HOST}:{WS_PORT}")
        logger.info(f"Monitoring GPIO pins: {GPIO_PINS}")
        logger.info(f"Sending sensor data & serial output")
        
        try:
            await asyncio.Future()  # run forever
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            broadcast_task.cancel()
            if RPI_AVAILABLE:
                GPIO.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
