#include "WiFiS3.h"
#include <ArduinoMqttClient.h>

char ssid[] = "Tec-IoT";         // WiFi SSID
char pass[] = "spotless.magnetic.bridge";  // WiFi password 

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

// MQTT Broker
const char broker[] = "test.mosquitto.org";
int        port     = 1883;

// SOLO publicamos
const char publish_topic[]  = "umisumi/test/message";

int num = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) { }

  // ---------------------------
  // Conexión al WiFi
  // ---------------------------
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    Serial.print(".");
    delay(2000);
  }

  Serial.println("\nConnected to WiFi!");
  Serial.println();

  // ---------------------------
  // Conexión al broker MQTT
  // ---------------------------
  Serial.print("Connecting to MQTT broker... ");

  if (!mqttClient.connect(broker, port)) {
    Serial.print("Failed! Error code = ");
    Serial.println(mqttClient.connectError());
    while (1); // Stop here
  }

  Serial.println("Connected to MQTT!");
}

void loop() {
  // ---------------------------
  // PUBLICAR MENSAJE
  // ---------------------------
  delay(5000);
  Serial.println("Sending MQTT message...");

  mqttClient.beginMessage(publish_topic);
  mqttClient.print("Hola chat ");
  mqttClient.print(num);
  mqttClient.endMessage();

  Serial.print("Sent: Hola chat ");
  Serial.println(num);

  num += 1;
}