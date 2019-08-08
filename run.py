from rplidar import RPLidar
from pyee import BaseEventEmitter
import asyncio
import websockets
import signal
import json
import time

lidar = RPLidar('/dev/tty.SLAB_USBtoUART')
info = lidar.get_info()
print(info)

health = lidar.get_health()
print(health)

ee = BaseEventEmitter()

async def startup_lidar():
  print('started lidar')
  try:
    for i, scan in enumerate(lidar.iter_scans()):
      print('has scan %d' % len(scan))
      if USERS:
        str_data = json.dumps({'scan': scan})
        await asyncio.wait([user.send(str_data) for user in USERS])
      await asyncio.sleep(0.01)
  except:
    print('has error')
  finally:
    await asyncio.sleep(0.01)

USERS = set()

async def register(websocket):
  USERS.add(websocket)

async def unregister(websocket):
  USERS.remove(websocket)

async def connected(websocket, path):
  await register(websocket)
  print('registering user')
  try:
    async for message in websocket:
      if (message == 'stop'):
        disconnect_lidar()
      print(message)
  finally:
    print('unregistering user')
    await unregister(websocket)

@ee.on('lidar')
async def async_handler(str_data):
  print('sending data')
  if USERS:
    print('sending data')
    await asyncio.wait([user.send(str_data) for user in USERS])

def disconnect_lidar(_, __):
  lidar.stop()
  lidar.stop_motor()
  lidar.disconnect()

signal.signal(signal.SIGINT, disconnect_lidar)

start_server = websockets.serve(connected, 'localhost', 9999)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_until_complete(startup_lidar())
asyncio.get_event_loop().run_forever()