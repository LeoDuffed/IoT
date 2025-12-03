// ========================================================
//  LIBRERÍAS
// ========================================================
#include <Servo.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BMP280.h>

#include "WiFiS3.h"
#include "ArduinoMqttClient.h"

// ========================================================
//  CONFIGURACIÓN OLED + BMP280
// ========================================================
#define ANCHO 128
#define ALTO  64

Adafruit_SSD1306 oled(ANCHO, ALTO, &Wire);
Adafruit_BMP280 bmp;

// ========================================================
//  PINES DE SENSORES
//  (AJUSTADOS A TU CÓDIGO NUEVO)
// ========================================================
const int pinLluvia = A0;
const int pinMQ2    = A1;
const int pinLDR    = A2;

// ========================================================
//  SERVO
// ========================================================
Servo motor;
const int pinServo = 9;
int umbralLluvia = 500;

// ========================================================
//  BUZZERS
// ========================================================
unsigned long tiempoInicio;
const unsigned long TIEMPO_CALENTAMIENTO_MQ2 = 30000; // 30 segundos 
const int buzzerGas = 8;   // Activo
const int UMBRAL_LUZ = 800;

// ========================================================
//  VARS MQ2
// ========================================================
int valorBaseMQ2 = 0;
int margen = 25;

// ========================================================
//  WIFI + MQTT CONFIG
// ========================================================
char ssid[] = "Tec-IoT";
char pass[] = "spotless.magnetic.bridge";

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

const char broker[] = "test.mosquitto.org";
int port = 1883;
const char topic[] = "umisumi/test/message";

// ========================================================
//  NOTAS PARA LA MELODÍA GREAT FAIRY'S FOUNTAIN
// ========================================================
#define NOTE_C5  523
#define NOTE_D5  587
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_G5  784
#define NOTE_A5  880
#define NOTE_B5  988

int melodyGF[] = {
  NOTE_A5, NOTE_E5, NOTE_F5, NOTE_E5, NOTE_A5,
  NOTE_A5, NOTE_E5, NOTE_F5, NOTE_E5, NOTE_A5,
  NOTE_B5, NOTE_F5, NOTE_G5, NOTE_F5, NOTE_B5,
  NOTE_B5, NOTE_F5, NOTE_G5, NOTE_F5, NOTE_B5
};

int durationGF[] = {
  350, 350, 350, 350, 650,
  350, 350, 350, 350, 650,
  350, 350, 350, 350, 650,
  350, 350, 350, 350, 650
};

int notesGF = sizeof(melodyGF) / sizeof(melodyGF[0]);

// ========================================================
//  PROTOTIPO FUNCIÓN MQTT
// ========================================================
void enviarJSON(const char* type, float value);

// ========================================================
//  SETUP
// ========================================================
void setup() {
  Serial.begin(115200);

  // Servo
  motor.attach(pinServo);
  motor.write(90);

  // Pines buzzers
  pinMode(buzzerGas, OUTPUT);

  // -----------------------------------------
  // Calibración MQ2
  // -----------------------------------------
  Serial.println("Calibrando sensor MQ2...");
  long suma = 0;
  for (int i = 0; i < 20; i++) {
    suma += analogRead(pinMQ2);
    delay(100);
  }
  valorBaseMQ2 = suma / 20;
  Serial.print("Valor base gas: ");
  Serial.println(valorBaseMQ2);

  // -----------------------------------------
  // OLED
  // -----------------------------------------
  if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Error OLED");
    while (1);
  }
  oled.setRotation(3);
  oled.clearDisplay();

  // -----------------------------------------
  // BMP280
  // -----------------------------------------
  if (!bmp.begin(0x76)) {
    Serial.println("Error BMP280");
    while (1);
  }

  Serial.println("Iniciando WiFi...");

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
  Serial.println("Sistema listo.\n");
  tiempoInicio = millis();
}

// ========================================================
//  FUNCIÓN PARA ENVIAR JSON POR MQTT
// ========================================================
void enviarJSON(const char* type, float value) {
  mqttClient.beginMessage(topic);
  mqttClient.print("{\"type\":\"");
  mqttClient.print(type);
  mqttClient.print("\",\"value\":");
  mqttClient.print(value);
  mqttClient.println("}");
  mqttClient.endMessage();
}

// ========================================================
//  LOOP
// ========================================================
void loop() {
  // Mantener viva la conexión MQTT
  mqttClient.poll();

  // ======================================================
  // SENSOR DE LLUVIA + PORCENTAJE + SERVO
  // ======================================================
  int valorLluvia = analogRead(pinLluvia);

  // Convertir a porcentaje de humedad
  // 1023 (seco) -> 0 %, 0 (muy mojado) -> 100 %
  int porcentajeLluvia = map(valorLluvia, 1023, 0, 0, 100);

  // Control del servo
  if (porcentajeLluvia > 10) {
    motor.write(0);
  } else {
    motor.write(90);
  }

  // ======================================================
  // SENSOR DE GAS + BUZZER ACTIVO
  // ======================================================
  int lecturaMQ2 = analogRead(pinMQ2);
  bool gasDetectado = false;

  if (millis() - tiempoInicio > TIEMPO_CALENTAMIENTO_MQ2) {
    gasDetectado = lecturaMQ2 > valorBaseMQ2 + margen;
  }

  digitalWrite(buzzerGas, gasDetectado ? HIGH : LOW);

  // ======================================================
  // FOTORESISTENCIA
  // ======================================================
  int luzRaw = analogRead(pinLDR);
  // También calculamos un porcentaje de luz para MQTT
  // 0 (oscuro) -> 0 %, 1023 (muy iluminado) -> 100 %
  int luzPercent = map(luzRaw, 0, 1023, 0, 100);
  luzPercent = constrain(luzPercent, 0, 100);

  // ======================================================
  // BMP280 LECTURAS
  // ======================================================
  float temp = bmp.readTemperature();
  float press = bmp.readPressure() / 100.0; // hPa

  // ======================================================
  // IMPRESIÓN EN OLED
  // ======================================================
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  oled.setCursor(25, 5);
  oled.setTextSize(1);
  oled.print(temp, 1);
  oled.println(" C");

  oled.setCursor(10, 30);
  oled.print(press, 0);
  oled.println(" hPa");

  // Si quieres, puedes mostrar porcentaje de lluvia
  oled.setCursor(0, 50);
  oled.print("Rain: ");
  oled.print(porcentajeLluvia);
  oled.println("%");

  oled.display();

  // ======================================================
  // MONITOR SERIAL
  // ======================================================
  Serial.println("===== LECTURAS DEL SISTEMA =====");
  Serial.print("Temperatura: "); Serial.print(temp); Serial.println(" C");
  Serial.print("Presion: "); Serial.print(press); Serial.println(" hPa");
  Serial.print("Lluvia (A0): "); Serial.print(porcentajeLluvia); Serial.println("%");
  Serial.print("Luz raw (A2): "); Serial.println(luzRaw);
  Serial.print("Luz %: "); Serial.println(luzPercent);
  Serial.print("Gas MQ2 (A1): "); Serial.print(lecturaMQ2);
  Serial.print(" | Base: "); Serial.print(valorBaseMQ2);
  Serial.print(" | Detectado: ");
  Serial.println(gasDetectado ? "SI" : "NO");
  Serial.println("================================\n");

  // ======================================================
  // ENVÍO POR MQTT (MISMO FORMATO QUE TU CÓDIGO VIEJO)
  // ======================================================
  enviarJSON("gas", lecturaMQ2);
  enviarJSON("humedad", porcentajeLluvia);
  enviarJSON("luz", luzPercent);
  enviarJSON("temperatura", temp);
  enviarJSON("presion", press);

  delay(1000);
}