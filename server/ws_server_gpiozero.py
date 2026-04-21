#!/usr/bin/env python3
"""
Alternative server using gpiozero library
More modern approach for newer Raspberry Pi OS versions
"""
import asyncio
import json
import logging
from datetime import datetime

try:
    import websockets
except ImportError:
    raise ImportError("websockets library not found. Install with: pip install websockets")

# Try gpiozero first, fallback to RPi.GPIO
try:
    from gpiozero import Button
    USE_GPIOZERO = True
except ImportError:
    USE_GPIOZERO = False
    try:
        import RPi.GPIO as GPIO
    except ImportError:
        print("Warning: GPIO library not found, running in simulation mode")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GPIO_PINS = [17, 27, 22, 23]
WS_HOST = "0.0.0.0"
WS_PORT = 8765
UPDATE_INTERVAL = 1.0

clients = set()
buttons = {}


def init_gpio():
    """Initialize GPIO using gpiozero"""
    if not USE_GPIOZERO:
        logger.info("gpiozero not available - using simulation")
        return
    
    try:
        for pin in GPIO_PINS:
            buttons[pin] = Button(pin, pull_up=False)
        logger.info(f"GPIO initialized with gpiozero: {GPIO_PINS}")
    except Exception as e:
        logger.error(f"GPIO initialization error: {e}")


def read_gpio_states():
    """Read GPIO states"""
    states = {}
    if USE_GPIOZERO:
        for pin in GPIO_PINS:
            try:
                states[pin] = buttons[pin].is_pressed
            except Exception as e:
                logger.warning(f"Error reading pin {pin}: {e}")
                states[pin] = False
    else:
        for pin in GPIO_PINS:
            states[pin] = False
    return states


async def broadcast():
    """Broadcast state to all clients"""
    while True:
        try:
            await asyncio.sleep(UPDATE_INTERVAL)
            
            if not clients:
                continue
            
            message = {
                "type": "state",
                "timestamp": datetime.now().isoformat(),
                "gpio": read_gpio_states(),
            }
            
            disconnected = set()
            for client in clients:
                try:
                    await client.send(json.dumps(message))
                except:
                    disconnected.add(client)
            
            clients.difference_update(disconnected)
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await asyncio.sleep(1)


async def handle_client(websocket, path):
    """Handle client connection"""
    clients.add(websocket)
    logger.info(f"Client connected (total: {len(clients)})")
    
    try:
        message = {
            "type": "init",
            "timestamp": datetime.now().isoformat(),
            "gpio": read_gpio_states(),
            "pins": GPIO_PINS,
        }
        await websocket.send(json.dumps(message))
        
        async for msg in websocket:
            try:
                data = json.loads(msg)
                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
            except:
                pass
    finally:
        clients.discard(websocket)
        logger.info(f"Client disconnected (total: {len(clients)})")


async def main():
    """Start server"""
    init_gpio()
    
    asyncio.create_task(broadcast())
    
    async with websockets.serve(handle_client, WS_HOST, WS_PORT):
        logger.info(f"WebSocket server on ws://{WS_HOST}:{WS_PORT}")
        try:
            await asyncio.Future()
        except KeyboardInterrupt:
            logger.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
