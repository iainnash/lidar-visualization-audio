from rplidar import RPLidar

lidar = RPLidar('/dev/tty.SLAB_USBtoUART')
info = lidar.get_info()
print(info)

health = lidar.get_health()
print(health)

lidar.stop()
lidar.disconnect()



