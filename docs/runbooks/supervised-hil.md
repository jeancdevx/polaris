# Supervised hardware-in-the-loop test

Use this procedure for ESP32 firmware tests that move barriers, drive LEDs, or
energize connected hardware. A human supervisor must remain at the rig.

## Before energizing

1. Build the exact PlatformIO environment used by the connected board.
2. Inspect wiring, pin assignments, power limits, grounds, and mechanical stops.
3. Clear people and objects from barrier travel; keep the emergency power cutoff
   reachable.
4. Disconnect actuator power while flashing. Confirm the expected board and serial
   port before upload.
5. Record firmware commit, environment, device ID, test owner, and expected motion.

## Test

1. Restore actuator power with the mechanism in a safe neutral position.
2. Exercise one output at a time, beginning with LEDs/displays before servos.
3. Verify commanded direction, travel limits, timeout behavior, and safe startup.
4. Test loss of MQTT/network connectivity and confirm outputs return to or remain in
   the documented safe state.
5. Stop immediately on unexpected motion, heat, noise, repeated resets, or pin
   contention.

## Finish

Remove actuator power, save serial logs and observations, and document pass/fail per
device. Do not leave a failed rig powered or unattended.
