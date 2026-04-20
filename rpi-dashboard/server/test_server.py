#!/usr/bin/env python3
"""
Test script to verify the WebSocket server works correctly
"""
import asyncio
import json
import websockets
import time

async def test_server(host="localhost", port=8765):
    """Test WebSocket connection"""
    uri = f"ws://{host}:{port}"
    
    print(f"🧪 Testing WebSocket server at {uri}...")
    print()
    
    try:
        async with websockets.connect(uri) as ws:
            print("✅ Connected to server!")
            print()
            
            # Receive init message
            msg = await ws.recv()
            data = json.loads(msg)
            print(f"📨 Init message received:")
            print(f"   Pins monitored: {data.get('pins', [])}")
            print(f"   GPIO state: {data.get('gpio', {})}")
            print()
            
            # Receive a few state updates
            print("📡 State updates (5 seconds):")
            start_time = time.time()
            
            while time.time() - start_time < 5:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    if data.get('type') == 'state':
                        gpio = data.get('gpio', {})
                        states = ', '.join([f"GPIO{p}: {'HIGH' if v else 'LOW'}" for p, v in gpio.items()])
                        print(f"   {states}")
                except asyncio.TimeoutError:
                    pass
            
            print()
            print("✅ Server test successful!")
            
    except ConnectionRefusedError:
        print(f"❌ Connection failed: Server not running on {uri}")
        print()
        print("Start the server with:")
        print("  cd rpi-dashboard/server")
        print("  python3 ws_server.py")
    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_server())
