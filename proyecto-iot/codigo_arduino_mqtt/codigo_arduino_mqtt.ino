// Falta arreglar el codigo de la lluvia 

// ======================================
//  LIBRERÍAS NECESARIAS
// ======================================
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include "WiFiS3.h"
#include "ArduinoMqttClient.h"

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
//  SENSOR DE HUMEDAD (HW-028)
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
int lecturaLuzMax = 15000;  // ajústalo si quieres

// ======================================
//  SENSOR DE GAS (MQ-x) + BUZZER
// ======================================
#define gasPin A2
#define gasBuzzer 4
int gasValue = 0;

// ======================================
//  PROTOTIPO FUNCIÓN MQTT
// ======================================
void enviarJSON(const char* type, float value);

// ======================================
//  SETUP
// ======================================
void setup() {
  Serial.begin(115200);
  while (!Serial) {;}

  Wire.begin();
  analogReadResolution(14);   // 0–16383

  pinMode(rainDigital, INPUT);
  pinMode(gasPin, INPUT);
  pinMode(gasBuzzer, OUTPUT);

  // ---- BMP280 ----
  Serial.println(F("Iniciando BMP280..."));
  if (!bmp.begin(0x76)) {
    Serial.println(F("No se encontro BMP280 en 0x76, probando 0x77..."));
    if (!bmp.begin(0x77)) {
      Serial.println(F("Error: no se pudo encontrar BMP280 :("));
      while (1) { delay(100); }
    }
  }
  Serial.println(F("BMP280 OK!"));

  // ---------------------------------
  // WiFi
  // ---------------------------------
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // ---------------------------------
  // Probar conexión TCP al broker
  // ---------------------------------
  Serial.print("Probando TCP al broker: ");
  Serial.println(broker);
  if (!wifiClient.connect(broker, port)) {
    Serial.println("❌ No se pudo abrir conexión TCP al broker");
  } else {
    Serial.println("✅ TCP OK, cierro y sigo con MQTT");
    wifiClient.stop();
  }

  // ---------------------------------
  // MQTT
  // ---------------------------------
  mqttClient.setId("arduino-sensores-casa-1");

  Serial.print("Connecting to MQTT broker: ");
  Serial.println(broker);

  int intentos = 0;
  while (!mqttClient.connect(broker, port)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());
    intentos++;

    if (intentos >= 3) {
      Serial.println("No se pudo conectar a MQTT después de 3 intentos. Me quedo aquí.");
      while (1);
    }

    Serial.println("Reintentando en 3 segundos...");
    delay(3000);
  }

  Serial.println("✅ MQTT conectado!");
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
  // Mantener viva la conexión MQTT
  mqttClient.poll();

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
  // HUMEDAD (sensor de lluvia HW-028)
  // ======================
  rainValue = analogRead(rainAnalog);
  rainVoltage = (rainValue * 5.0) / 16384.0;

  // AHORA: 0 (seco) -> 0 %, 16383 (muy mojado) -> 100 %
  rainPercent = map(rainValue, 0, 16383, 0, 100);
  rainPercent = constrain(rainPercent, 0, 100);

  enviarJSON("humedad", rainPercent);

  // ======================
  // LUZ (LDR)
  // ======================
  lightValue = analogRead(fotoRes);
  lightPercent = map(lightValue, lecturaOscuro, lecturaLuzMax, 0, 100);
  lightPercent = constrain(lightPercent, 0, 100);
  lightPercent = lightPercent - 30;

  enviarJSON("luz", lightPercent);

  // ======================
  // BMP280 (Temp + Presion)
  // ======================
  tempC = bmp.readTemperature();
  pres_hPa = bmp.readPressure() / 100.0F;

  enviarJSON("temperatura", tempC);
  enviarJSON("presion", pres_hPa);

  // ======================
  // DEBUG EN SERIE
  // ======================
  Serial.println("=====================================");
  Serial.print("Gas raw: "); Serial.println(gasValue);

  Serial.print("Rain raw: "); Serial.print(rainValue);
  Serial.print("  | Rain V: "); Serial.print(rainVoltage, 3);
  Serial.print(" V  | Rain %: "); Serial.println(rainPercent);

  Serial.print("Luz raw: "); Serial.print(lightValue);
  Serial.print("  | Luz %: "); Serial.println(lightPercent);

  Serial.print("Temp: "); Serial.print(tempC); Serial.println(" C");
  Serial.print("Pres: "); Serial.print(pres_hPa); Serial.println(" hPa");
  Serial.println("=====================================\n");

  delay(1500);
}