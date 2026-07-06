#include "ultrasonic_sensor.h"

UltrasonicSensor::UltrasonicSensor(int trigPin, int echoPin)
    : trigPin_(trigPin), echoPin_(echoPin) {}

void UltrasonicSensor::begin() {
  pinMode(trigPin_, OUTPUT);
  pinMode(echoPin_, INPUT);
}

int UltrasonicSensor::measureCm() {
  digitalWrite(trigPin_, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin_, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin_, LOW);

  const unsigned long duration = pulseIn(echoPin_, HIGH, 30'000);
  if (duration == 0) {
    return 999;
  }

  const int distance = static_cast<int>(duration * 0.034f / 2.0f);
  return distance;
}
