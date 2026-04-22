#!/usr/bin/env python3
"""
Mock WebSocket server for dashboard testing from a PC.

Run from the dashboard folder, then point the dashboard to:
    ws://localhost:8765

Dependencies:
    pip install websockets
"""

import argparse
import asyncio
import json
import logging
import math
import random
from datetime import datetime

try:
    import websockets
except ImportError:
    print("Error: websockets library not found. Install with: pip install websockets")
    raise

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DEFAULT_HOST = '0.0.0.0'
DEFAULT_PORT = 8765
UPDATE_INTERVAL = 1.0
GPIO_PINS = [17, 27, 22, 23]

clients = set()


def generate_gpio_state() -> dict:
    return {str(pin): random.choice([True, False]) for pin in GPIO_PINS}


def generate_sensor_readings() -> dict:
    now = datetime.utcnow().timestamp()
    return {
        'temperature': {
            'label': 'Temperature',
            'unit': '°C',
            'value': round(22 + 4 * math.sin(now / 10) + random.uniform(-0.5, 0.5), 2)
        },
        'humidity': {
            'label': 'Humidity',
            'unit': '%',
            'value': round(55 + 10 * math.cos(now / 12) + random.uniform(-1.5, 1.5), 2)
        },
        'pressure': {
            'label': 'Pressure',
            'unit': 'hPa',
            'value': round(1013 + 3 * math.sin(now / 18) + random.uniform(-0.3, 0.3), 2)
        }
    }


def create_state_message() -> str:
    return json.dumps({
        'type': 'state',
        'timestamp': datetime.utcnow().isoformat(),
        'gpio': generate_gpio_state(),
        'sensors': generate_sensor_readings(),
        'serial': 'MOCK: hello from mock_server',
    })


def create_init_message() -> str:
    return json.dumps({
        'type': 'init',
        'timestamp': datetime.utcnow().isoformat(),
        'gpio': generate_gpio_state(),
        'pins': GPIO_PINS,
        'sensors': generate_sensor_readings(),
        'serial': None,
    })


async def broadcast_state() -> None:
    while True:
        if clients:
            message = create_state_message()
            logger.debug('Broadcasting state to %d clients', len(clients))
            disconnected = set()
            for websocket in clients:
                try:
                    await websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(websocket)
                except Exception as exc:
                    logger.warning('Error sending to client: %s', exc)
                    disconnected.add(websocket)
            for websocket in disconnected:
                clients.discard(websocket)
        await asyncio.sleep(UPDATE_INTERVAL)


async def handle_client(websocket, path):
    clients.add(websocket)
    logger.info('Client connected: %s (total=%d)', websocket.remote_address, len(clients))

    try:
        await websocket.send(create_init_message())
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get('type') == 'ping':
                    await websocket.send(json.dumps({'type': 'pong', 'timestamp': datetime.utcnow().isoformat()}))
                elif data.get('type') == 'get_state':
                    await websocket.send(create_state_message())
            except json.JSONDecodeError:
                logger.warning('Received invalid JSON from client')
    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as exc:
        logger.error('Client handler error: %s', exc)
    finally:
        clients.discard(websocket)
        logger.info('Client disconnected: %s (total=%d)', websocket.remote_address, len(clients))


async def main(host: str, port: int) -> None:
    async with websockets.serve(handle_client, host, port):
        logger.info('Mock server listening on ws://%s:%d', host, port)
        await broadcast_state()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Mock WebSocket server for dashboard testing')
    parser.add_argument('--host', default=DEFAULT_HOST, help='Host to bind (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help='Port to bind (default: 8765)')
    parser.add_argument('--interval', type=float, default=UPDATE_INTERVAL, help='Broadcast interval in seconds')
    args = parser.parse_args()

    UPDATE_INTERVAL = args.interval

    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        logger.info('Mock server stopped by user')
