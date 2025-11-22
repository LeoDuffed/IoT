// Falta arreglar glas y lluvia (humedad)


// ======================================
//  LIBRERÍAS NECESARIAS
// ======================================
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include "WiFiS3.h"
#include <ArduinoMqttClient.h>

// ======================================
//  WIFI + MQTT CONFIG
// ======================================
char ssid[] = "Tec-IoT";
char pass[] = "spotless.magnetic.bridge";

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

const char broker[] = "test.mosquitto.org";
int port = 1883;
const char topic[] = "umisumi/test/message";

// ======================================
//  BMP280
// ======================================
Adafruit_BMP280 bmp;
float tempC = 0.0;
float pres_hPa = 0.0;

// ======================================
//  SENSOR DE LLUVIA HW-028
// ======================================
#define rainAnalog A1
#define rainDigital 3
int rainValue = 0;
float rainVoltage = 0.0;
int rainPercent = 0;

// ======================================
//  FOTORESISTENCIA (LDR)
// ======================================
#define fotoRes A0
int lightValue = 0;
int lightPercent = 0;
int lecturaOscuro = 200;
int lecturaLuzMax = 15000;

// ======================================
//  SENSOR DE GAS (MQ-x) + BUZZER
// ======================================
#define gasPin A2
#define gasBuzzer 4
int gasValue = 0;

// ======================================
//  SETUP
// ======================================
void setup() {
  Serial.begin(115200);
  Wire.begin();

  analogReadResolution(14);

  pinMode(rainDigital, INPUT);
  pinMode(gasPin, INPUT);
  pinMode(gasBuzzer, OUTPUT);

  // ---- BMP280 ----
  if (!bmp.begin(0x76)) {
    if (!bmp.begin(0x77)) {
      Serial.println("ERROR BMP280");
      while (1);
    }
  }

  // ---------------------------------
  // WiFi
  // ---------------------------------
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    Serial.print(".");
    delay(2000);
  }
  Serial.println("\nWiFi conectado!");

  // ---------------------------------
  // MQTT
  // ---------------------------------
  Serial.print("Connecting to MQTT...");
  if (!mqttClient.connect(broker, port)) {
    Serial.print("Error MQTT = ");
    Serial.println(mqttClient.connectError());
    while (1);
  }
  Serial.println("MQTT conectado!");
}

// ======================================
//  FUNCIÓN PARA ENVIAR JSON POR MQTT
// ======================================
void enviarJSON(const char* type, float value) {
  mqttClient.beginMessage(topic);
  mqttClient.print("{\"type\":\"");
  mqttClient.print(type);
  mqttClient.print("\",\"value\":");
  mqttClient.print(value);
  mqttClient.println("}");
  mqttClient.endMessage();
}

// ======================================
//  LOOP PRINCIPAL
// ======================================
void loop() {

  // ======================
  // GAS
  // ======================
  gasValue = analogRead(gasPin);
  if (gasValue > 70) {
    digitalWrite(gasBuzzer, HIGH);
  } else {
    digitalWrite(gasBuzzer, LOW);
  }
  enviarJSON("gas", gasValue);

  // ======================
  // LLUVIA
  // ======================
  rainValue = analogRead(rainAnalog);
  rainVoltage = (rainValue * 5.0) / 16384.0;
  rainPercent = map(rainValue, 16383, 0, 0, 100);
  enviarJSON("lluvia", rainPercent);

  // ======================
  // LUZ
  // ======================
  lightValue = analogRead(fotoRes);
  lightPercent = map(lightValue, lecturaOscuro, lecturaLuzMax, 0, 100);
  lightPercent = constrain(lightPercent, 0, 100);
  enviarJSON("luz", lightPercent);

  // ======================
  // BMP280 (Temp + Presion)
  // ======================
  tempC = bmp.readTemperature();
  pres_hPa = bmp.readPressure() / 100.0;

  enviarJSON("temperatura", tempC);
  enviarJSON("presion", pres_hPa);

  // ======================
  // DEBUG
  // ======================
  Serial.println("=====================================");
  Serial.print("Gas: "); Serial.println(gasValue);
  Serial.print("Lluvia: "); Serial.println(rainPercent);
  Serial.print("Luz: "); Serial.println(lightPercent);
  Serial.print("Temp: "); Serial.println(tempC);
  Serial.print("Pres: "); Serial.println(pres_hPa);
  Serial.println("=====================================\n");

  delay(1500);
}