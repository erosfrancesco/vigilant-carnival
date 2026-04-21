#!/usr/bin/env python3
"""
Minimal WebSocket server - absolute minimum version (< 100 lines)
Use this if you need the absolute lightest weight implementation
"""
import asyncio
import json
import logging
from datetime import datetime

try:
    import websockets
except ImportError:
    raise ImportError("pip install websockets")

# Config
WS_PORT = 8765
GPIO_PINS = [17, 27, 22, 23]
UPDATE_INTERVAL = 1.0

# Try GPIO, fallback to simulation
try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)
    for pin in GPIO_PINS:
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
    HAVE_GPIO = True
except:
    HAVE_GPIO = False

clients = set()


def read_pins():
    """Read GPIO pin states"""
    states = {}
    if HAVE_GPIO:
        for pin in GPIO_PINS:
            states[pin] = bool(GPIO.input(pin))
    else:
        for pin in GPIO_PINS:
            states[pin] = False
    return states


async def broadcast():
    """Broadcast state every UPDATE_INTERVAL seconds"""
    while True:
        await asyncio.sleep(UPDATE_INTERVAL)
        if not clients:
            continue
        
        msg = json.dumps({
            "type": "state",
            "timestamp": datetime.now().isoformat(),
            "gpio": read_pins()
        })
        
        for client in list(clients):
            try:
                await client.send(msg)
            except:
                clients.discard(client)


async def handler(ws, path):
    """Handle client connection"""
    clients.add(ws)
    try:
        # Send init
        await ws.send(json.dumps({
            "type": "init",
            "gpio": read_pins(),
            "pins": GPIO_PINS
        }))
        
        # Keep alive
        async for msg in ws:
            pass
    finally:
        clients.discard(ws)


async def main():
    """Start server"""
    asyncio.create_task(broadcast())
    async with websockets.serve(handler, "0.0.0.0", WS_PORT):
        print(f"WebSocket server on ws://0.0.0.0:{WS_PORT}")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        if HAVE_GPIO:
            GPIO.cleanup()
