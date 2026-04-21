#!/usr/bin/env python3
"""
Enhanced WebSocket Server with Real Sensor Support
Support for temperature, humidity, distance, and custom sensors

Install dependencies:
    pip install websockets RPi.GPIO adafruit-circuitpython-dht board
"""

import asyncio
import websockets
import json
import time
from datetime import datetime
import math
import random

# Try to import RPi-specific modules (graceful fallback for non-RPi systems)
try:
    import RPi.GPIO as GPIO
    HAVE_GPIO = True
except (ImportError, RuntimeError):
    HAVE_GPIO = False
    print("⚠️  GPIO não disponível - usando simulação")

# Try to import sensor libraries
try:
    import board
    import adafruit_dht
    DHT_SENSOR = adafruit_dht.DHT22(board.D4)
    HAVE_DHT = True
except (ImportError, RuntimeError):
    HAVE_DHT = False
    DHT_SENSOR = None
    print("⚠️  DHT22 não disponível - usando dados simulados")


class SensorSimulator:
    """Simula dados de sensores para testes"""
    
    def __init__(self):
        self.temperature = 20 + 5 * math.sin(time.time() / 10)
        self.humidity = 60 + 20 * math.cos(time.time() / 8)
        self.pressure = 1013 + random.uniform(-2, 2)
    
    def read(self):
        """Retorna dados simulados realistas"""
        # Simulação com padrão senoidal + ruído
        t = time.time()
        self.temperature = 20 + 5 * math.sin(t / 10) + random.uniform(-0.5, 0.5)
        self.humidity = 60 + 20 * math.cos(t / 8) + random.uniform(-2, 2)
        self.pressure = 1013 + 2 * math.sin(t / 15) + random.uniform(-0.2, 0.2)
        
        return {
            "temperature": round(self.temperature, 2),
            "humidity": round(self.humidity, 2),
            "pressure": round(self.pressure, 2),
        }


class SensorManager:
    """Gerencia sensores reais com fallback para simulação"""
    
    def __init__(self):
        self.simulator = SensorSimulator()
        self.dht = DHT_SENSOR if HAVE_DHT else None
    
    def read_temperature(self):
        """Lê temperatura (real ou simulada)"""
        if self.dht:
            try:
                return round(self.dht.temperature, 2)
            except RuntimeError:
                pass
        return self.simulator.read()["temperature"]
    
    def read_humidity(self):
        """Lê umidade (real ou simulada)"""
        if self.dht:
            try:
                return round(self.dht.humidity, 2)
            except RuntimeError:
                pass
        return self.simulator.read()["humidity"]
    
    def read_all_sensors(self):
        """Lê todos os sensores (reais ou simulados)"""
        sim = self.simulator.read()
        
        result = {
            "temperature": self.read_temperature() if HAVE_DHT else sim["temperature"],
            "humidity": self.read_humidity() if HAVE_DHT else sim["humidity"],
            "pressure": sim["pressure"],  # Sempre simulado nesse exemplo
        }
        
        return result


class EnhancedWebSocketServer:
    """WebSocket server com suporte completo a sensores"""
    
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.sensor_manager = SensorManager()
        
        # Configurar GPIO (se disponível)
        if HAVE_GPIO:
            self.setup_gpio()
        
        self.gpio_pins = {17, 27, 22, 23}
        self.serial_data = ""
    
    def setup_gpio(self):
        """Configura GPIO como entrada para monitoramento"""
        try:
            GPIO.setmode(GPIO.BCM)
            for pin in self.gpio_pins:
                GPIO.setup(pin, GPIO.IN)
        except Exception as e:
            print(f"Erro configurando GPIO: {e}")
    
    async def read_gpio_state(self):
        """Lê estado atual dos pinos GPIO"""
        if not HAVE_GPIO:
            # Simular estado dos pinos
            return {str(pin): random.choice([True, False]) for pin in self.gpio_pins}
        
        state = {}
        for pin in self.gpio_pins:
            try:
                state[str(pin)] = bool(GPIO.input(pin))
            except:
                state[str(pin)] = False
        return state
    
    async def send_state(self):
        """Envia estado completo para todos os clientes"""
        while True:
            try:
                # Ler sensores e GPIO
                sensors = self.sensor_manager.read_all_sensors()
                gpio_state = await self.read_gpio_state()
                
                message = {
                    "type": "state",
                    "timestamp": datetime.utcnow().isoformat(),
                    "gpio": gpio_state,
                    "sensors": sensors,
                    "serial": self.serial_data or None,
                }
                
                # Enviar para todos os clientes conectados
                if self.clients:
                    await asyncio.gather(
                        *[client.send(json.dumps(message)) for client in self.clients],
                        return_exceptions=True
                    )
                
                await asyncio.sleep(1)  # Enviar a cada segundo
            
            except Exception as e:
                print(f"Erro enviando estado: {e}")
                await asyncio.sleep(1)
    
    async def handle_client(self, websocket, path):
        """Lida com conexão de cliente WebSocket"""
        print(f"✅ Cliente conectado: {websocket.remote_address}")
        self.clients.add(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    # Processa comandos do cliente
                    if data.get("type") == "command":
                        cmd = data.get("command")
                        
                        # Exemplos de comandos
                        if cmd == "ping":
                            await websocket.send(json.dumps({
                                "type": "pong",
                                "timestamp": datetime.utcnow().isoformat()
                            }))
                        
                        elif cmd == "get_sensors":
                            sensors = self.sensor_manager.read_all_sensors()
                            await websocket.send(json.dumps({
                                "type": "sensors",
                                "data": sensors,
                                "timestamp": datetime.utcnow().isoformat()
                            }))
                
                except json.JSONDecodeError:
                    print(f"Mensagem inválida: {message}")
        
        except Exception as e:
            print(f"Erro comunicando com cliente: {e}")
        
        finally:
            self.clients.remove(websocket)
            print(f"❌ Cliente desconectado: {websocket.remote_address}")
    
    async def start(self):
        """Inicia o servidor"""
        print(f"🚀 Servidor WebSocket iniciando em ws://{self.host}:{self.port}")
        
        # Iniciar tarefa de envio de estado
        asyncio.create_task(self.send_state())
        
        # Iniciar servidor
        async with websockets.serve(self.handle_client, self.host, self.port):
            print(f"✅ Servidor pronto! Aguardando conexões...")
            await asyncio.Future()  # Executar indefinidamente


async def main():
    """Função principal"""
    server = EnhancedWebSocketServer()
    await server.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⛔ Servidor parado pelo usuário")
        if HAVE_GPIO:
            GPIO.cleanup()
