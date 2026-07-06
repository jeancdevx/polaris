#include "fc51_sensor.h"

Fc51Sensor::Fc51Sensor(int pin) : pin_(pin) {}

void Fc51Sensor::begin() { pinMode(pin_, INPUT); }

bool Fc51Sensor::readObstacle() const {
  // FC-51: LOW = obstáculo detectado
  return digitalRead(pin_) == LOW;
}
