"""
Example extensions for the WebSocket server
Add these functions/classes to ws_server.py to extend functionality
"""

import asyncio
import json
from datetime import datetime
from threading import Lock


# ============================================================================
# SENSOR EXAMPLES
# ============================================================================

class DHTSensor:
    """Read DHT22/DHT11 temperature and humidity sensor"""
    def __init__(self, sensor_type=22, pin=4):
        try:
            import Adafruit_DHT
            self.dht = Adafruit_DHT.DHT22 if sensor_type == 22 else Adafruit_DHT.DHT11
            self.pin = pin
            self.last_read = {"temp": None, "humidity": None}
        except ImportError:
            print("Adafruit_DHT not installed. Install with: pip install Adafruit_DHT")
            self.dht = None
    
    def read(self):
        if not self.dht:
            return None
        try:
            import Adafruit_DHT
            humidity, temperature = Adafruit_DHT.read_retry(self.dht, self.pin)
            if temperature and humidity:
                self.last_read = {"temp": temperature, "humidity": humidity}
            return self.last_read
        except Exception as e:
            print(f"DHT read error: {e}")
            return None


class DistanceSensor:
    """Read HC-SR04 ultrasonic distance sensor"""
    def __init__(self, trig_pin=23, echo_pin=24):
        try:
            import RPi.GPIO as GPIO
            from hcsr04 import sensor
            GPIO.setmode(GPIO.BCM)
            self.sensor = sensor.Measurement(echo_pin, trig_pin)
            self.last_distance = 0
        except ImportError:
            print("hcsr04 not installed. Install with: pip install hcsr04")
            self.sensor = None
    
    def read(self):
        if not self.sensor:
            return None
        try:
            distance = self.sensor.raw_distance()
            self.last_distance = distance
            return {"distance_cm": distance}
        except Exception as e:
            print(f"Distance sensor error: {e}")
            return None


class IMUSensor:
    """Read MPU6050 accelerometer/gyroscope"""
    def __init__(self, address=0x68):
        try:
            from mpu6050 import mpu6050
            self.mpu = mpu6050(address)
        except ImportError:
            print("mpu6050 not installed. Install with: pip install mpu6050")
            self.mpu = None
    
    def read(self):
        if not self.mpu:
            return None
        try:
            accel_data = self.mpu.get_accel_data()
            gyro_data = self.mpu.get_gyro_data()
            temp_data = self.mpu.get_temp()
            return {
                "acceleration": accel_data,
                "gyroscope": gyro_data,
                "temperature": temp_data
            }
        except Exception as e:
            print(f"IMU error: {e}")
            return None


# ============================================================================
# OUTPUT/CONTROL EXAMPLES
# ============================================================================

class PWMControl:
    """PWM control for motors, LEDs, etc."""
    def __init__(self, pin, frequency=1000, initial_duty=0):
        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(pin, GPIO.OUT)
            self.pwm = GPIO.PWM(pin, frequency)
            self.pwm.start(initial_duty)
            self.pin = pin
        except Exception as e:
            print(f"PWM init error: {e}")
            self.pwm = None
    
    def set_duty_cycle(self, duty):
        """Set PWM duty cycle (0-100)"""
        if self.pwm:
            try:
                self.pwm.ChangeDutyCycle(max(0, min(100, duty)))
                return True
            except Exception as e:
                print(f"PWM error: {e}")
        return False
    
    def cleanup(self):
        if self.pwm:
            self.pwm.stop()


class ServoControl:
    """Control servo motors"""
    def __init__(self, pin, min_angle=0, max_angle=180):
        self.pin = pin
        self.min_angle = min_angle
        self.max_angle = max_angle
        self.pwm = PWMControl(pin, frequency=50, initial_duty=7.5)  # 50Hz, center
    
    def set_angle(self, angle):
        """Set servo angle"""
        # Constrain angle
        angle = max(self.min_angle, min(self.max_angle, angle))
        # Convert angle to PWM duty cycle
        # Standard servo: 1ms = 0°, 2ms = 180° (5-10% at 50Hz)
        duty = 5 + (angle / 180) * 5
        return self.pwm.set_duty_cycle(duty)


# ============================================================================
# DATA LOGGING
# ============================================================================

class DataLogger:
    """Log sensor data to CSV file"""
    def __init__(self, filename="sensor_data.csv"):
        self.filename = filename
        self.lock = Lock()
        self.header_written = False
    
    def log(self, data):
        """Log data dict to CSV"""
        import csv
        
        with self.lock:
            write_header = not self.header_written
            
            try:
                with open(self.filename, 'a', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=data.keys())
                    if write_header:
                        writer.writeheader()
                        self.header_written = True
                    writer.writerow(data)
            except Exception as e:
                print(f"Logging error: {e}")


class DataBuffer:
    """Buffer sensor readings to reduce broadcast frequency"""
    def __init__(self, buffer_size=10):
        self.buffer_size = buffer_size
        self.buffer = []
    
    def add(self, data):
        self.buffer.append(data)
        if len(self.buffer) >= self.buffer_size:
            return self.get_average()
        return None
    
    def get_average(self):
        if not self.buffer:
            return None
        
        avg = {}
        for key in self.buffer[0].keys():
            try:
                values = [d[key] for d in self.buffer if key in d]
                if values:
                    avg[key] = sum(values) / len(values)
            except TypeError:
                avg[key] = self.buffer[0][key]
        
        self.buffer = []
        return avg


# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================

# Example: Add to ws_server.py broadcast_state()

"""
# Initialize sensors
temp_sensor = DHTSensor(sensor_type=22, pin=4)
distance_sensor = DistanceSensor(trig_pin=23, echo_pin=24)
data_logger = DataLogger()

async def broadcast_state():
    while True:
        try:
            await asyncio.sleep(UPDATE_INTERVAL)
            
            if not clients:
                continue
            
            # Read GPIO
            gpio_states = read_gpio_states()
            
            # Read sensors
            temp_data = temp_sensor.read()
            distance_data = distance_sensor.read()
            
            # Prepare message
            message = {
                "type": "state",
                "timestamp": datetime.now().isoformat(),
                "gpio": gpio_states,
                "sensors": {
                    "dht": temp_data,
                    "distance": distance_data
                }
            }
            
            # Log data
            log_entry = {
                "timestamp": message["timestamp"],
                **message["sensors"].get("dht", {}),
                **message["sensors"].get("distance", {}),
            }
            data_logger.log(log_entry)
            
            # Broadcast
            for client in clients:
                try:
                    await client.send(json.dumps(message))
                except:
                    pass
        
        except Exception as e:
            print(f"Broadcast error: {e}")
            await asyncio.sleep(1)
"""


# ============================================================================
# COMMAND HANDLERS
# ============================================================================

def setup_command_handlers():
    """Register command handlers for WebSocket messages"""
    
    commands = {
        "get_state": handle_get_state,
        "set_pin": handle_set_pin,
        "set_pwm": handle_set_pwm,
        "set_servo": handle_set_servo,
        "get_history": handle_get_history,
    }
    
    return commands


async def handle_get_state(data, websocket):
    """Get current system state"""
    response = {
        "type": "state",
        "timestamp": datetime.now().isoformat(),
        "gpio": read_gpio_states(),
    }
    await websocket.send(json.dumps(response))


async def handle_set_pin(data, websocket):
    """Set GPIO pin output"""
    pin = data.get("pin")
    value = data.get("value")
    
    try:
        import RPi.GPIO as GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, bool(value))
        
        response = {"type": "ok", "pin": pin, "value": value}
    except Exception as e:
        response = {"type": "error", "message": str(e)}
    
    await websocket.send(json.dumps(response))


async def handle_set_pwm(data, websocket):
    """Set PWM duty cycle"""
    # Implementation depends on your PWM setup
    pin = data.get("pin")
    duty = data.get("duty", 0)
    
    # Use PWMControl class defined above
    # pwm = PWMControl(pin)
    # pwm.set_duty_cycle(duty)
    
    response = {"type": "ok", "pin": pin, "duty": duty}
    await websocket.send(json.dumps(response))


async def handle_set_servo(data, websocket):
    """Set servo angle"""
    pin = data.get("pin")
    angle = data.get("angle", 90)
    
    # servo = ServoControl(pin)
    # servo.set_angle(angle)
    
    response = {"type": "ok", "pin": pin, "angle": angle}
    await websocket.send(json.dumps(response))


async def handle_get_history(data, websocket):
    """Get historical data"""
    # Read from CSV log file and send last N entries
    response = {
        "type": "history",
        "data": []  # Load from CSV
    }
    await websocket.send(json.dumps(response))


# ============================================================================
# WATCHDOG / HEALTH MONITORING
# ============================================================================

class HealthMonitor:
    """Monitor system health and alert on issues"""
    def __init__(self):
        self.cpu_temp_max = 80  # Celsius
        self.memory_usage_max = 90  # Percent
        self.alerts = []
    
    def get_cpu_temperature(self):
        """Read CPU temperature"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = int(f.read()) / 1000
                return temp
        except:
            return None
    
    def get_memory_usage(self):
        """Get memory usage percentage"""
        try:
            import psutil
            return psutil.virtual_memory().percent
        except:
            return None
    
    def check_health(self):
        """Check system health and return status"""
        cpu_temp = self.get_cpu_temperature()
        mem_usage = self.get_memory_usage()
        
        alerts = []
        
        if cpu_temp and cpu_temp > self.cpu_temp_max:
            alerts.append(f"High CPU temp: {cpu_temp}°C")
        
        if mem_usage and mem_usage > self.memory_usage_max:
            alerts.append(f"High memory: {mem_usage}%")
        
        return {
            "cpu_temp": cpu_temp,
            "memory_usage": mem_usage,
            "alerts": alerts
        }
