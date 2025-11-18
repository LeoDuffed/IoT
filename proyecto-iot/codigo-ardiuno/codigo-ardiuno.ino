// ======================================
//  CONEXIONES RESUMIDAS
//  HW-028 lluvia:
//    VCC -> 5V
//    GND -> GND
//    A0  -> A1
//    D0  -> D3
//
//  OLED SSD1306 (I2C):
//    GND -> GND
//    VCC -> 3.3V o 5V
//    SDA -> SDA (A4 en UNO)
//    SCL -> SCL (A5 en UNO)
//
//  Fotoresistencia:
//    Señal -> A0
//
//  Botón:
//    Botón -> D2 (con INPUT_PULLUP)
//    Otro -> GND
//
//  Buzzer Pasivo:
//    S -> D8
//    + -> 5V
//    - -> GND
//
//  BMP280 (I2C):
//    VIN -> 3.3V o 5V
//    GND -> GND
//    SCL -> SCL
//    SDA -> SDA
//
//  VL53L0X (I2C):
//    VIN -> 3.3V o 5V
//    GND -> GND
//    SCL -> SCL
//    SDA -> SDA
// ======================================


// === LIBRERÍAS I2C / OLED ===
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// === LIBRERÍAS SENSORES I2C ===
#include <Adafruit_BMP280.h>      // BMP280
#include "Adafruit_VL53L0X.h"     // VL53L0X

// ======================================
// === OLED SSD1306 ===
// ======================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ======================================
// === BMP280 ===
// ======================================
Adafruit_BMP280 bmp;  // I2C

float tempC = 0.0;
float pres_hPa = 0.0;

// ======================================
// === VL53L0X ===
// ======================================
Adafruit_VL53L0X lox = Adafruit_VL53L0X();
const int OFFSET_MM = 33;  // corrección de tu calibración
int dist_bruta = 0;
int dist_corr = 0;

// ======================================
// === SENSOR DE LLUVIA HW-028 ===
// ======================================
#define rainAnalog A1
#define rainDigital 3

int rainValue = 0;
float rainVoltage = 0.0;
int rainPercent = 0;

// ======================================
// === FOTORESISTENCIA ===
// ======================================
#define fotoRes A0
int lightValue = 0;
int lightPercent = 0;
int lecturaOscuro = 200;    // ajusta según tu sensor
int lecturaLuzMax = 15000;  // ajusta según tu sensor

// ======================================
// === BOTÓN EN D2 ===
// ======================================
#define buttonOne 2
int buttonState = 0;

// ======================================
// === BUZZER PASIVO (D8) — Mario ===
// ======================================
#define BUZZER 8

#define NOTE_C4  262
#define NOTE_D4  294
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_G4  392
#define NOTE_A4  440
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_D5  587
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_G5  784
#define NOTE_A5  880

int melody[] = {
  NOTE_E5, NOTE_E5, 0, NOTE_E5,
  0, NOTE_C5, NOTE_E5, 0,
  NOTE_G5, 0, 0, 0,
  NOTE_G4, 0, 0, 0
};

int noteDurations[] = {
  8,8,8,8,
  8,8,8,8,
  8,8,8,8,
  8,8,8,8
};

// ======================================
// === SETUP ===
// ======================================
void setup() {
  Serial.begin(115200);
  while (!Serial) { }

  // I2C
  Wire.begin();

  analogReadResolution(14);  // si tu placa lo soporta

  pinMode(buttonOne, INPUT_PULLUP);
  pinMode(rainDigital, INPUT);
  pinMode(BUZZER, OUTPUT);

  // ---------- OLED ----------
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED no detectada");
    while (1);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Sistema Iniciado!");
  display.display();
  delay(1000);

  // ---------- BMP280 ----------
  Serial.println(F("Iniciando BMP280..."));
  if (!bmp.begin(0x76)) {
    Serial.println(F("No se encontro BMP280 en 0x76, probando 0x77..."));
    if (!bmp.begin(0x77)) {
      Serial.println(F("Error: no se pudo encontrar BMP280 :("));
      display.clearDisplay();
      display.setCursor(0,0);
      display.println("BMP280 ERROR");
      display.display();
      while (1) { delay(100); }
    }
  }
  Serial.println(F("BMP280 OK!"));

  // ---------- VL53L0X ----------
  Serial.println("Iniciando VL53L0X...");
  if (!lox.begin()) {
    Serial.println("Error, VL53L0X no se encontro. Revisa conexiones.");
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("VL53L0X ERROR");
    display.display();
    while (1) { delay(100); }
  }
  Serial.println("VL53L0X OK!");

  display.clearDisplay();
  display.setCursor(0,0);
  display.println("Sensores OK!");
  display.display();
  delay(1000);
}

// ======================================
// === LOOP ===
// ======================================
void loop() {
  // ========================
  // SENSOR DE LLUVIA
  // ========================
  rainValue = analogRead(rainAnalog);
  rainVoltage = (rainValue * 5.0) / 16384.0;
  // 16383 -> seco, 0 -> muy mojado
  rainPercent = map(rainValue, 16383, 0, 0, 100);
  int rainDigitalState = digitalRead(rainDigital); // 0 = mojado, 1 = seco

  // ========================
  // FOTORESISTENCIA
  // ========================
  lightValue = analogRead(fotoRes);
  lightPercent = map(lightValue, lecturaOscuro, lecturaLuzMax, 0, 100);
  if (lightPercent < 0)   lightPercent = 0;
  if (lightPercent > 100) lightPercent = 100;

  // ========================
  // BOTÓN
  // ========================
  buttonState = digitalRead(buttonOne);

  // ========================
  // BMP280 (Temp y Presion)
  // ========================
  tempC    = bmp.readTemperature();         // °C
  pres_hPa = bmp.readPressure() / 100.0F;   // hPa

  // ========================
  // VL53L0X (Distancia)
  // ========================
  VL53L0X_RangingMeasurementData_t measure;
  lox.rangingTest(&measure, false);

  if (measure.RangeStatus != 4) {  // medida válida
    dist_bruta = measure.RangeMilliMeter;
    dist_corr  = dist_bruta - OFFSET_MM;
    if (dist_corr < 0) dist_corr = 0;
  } else {
    dist_bruta = 0;
    dist_corr  = 0;
  }

  // ========================
  // ENVÍO POR SERIAL (debug)
  // ========================
  Serial.print("Lluvia: ");
  Serial.print(rainPercent);
  Serial.print("% (A=");
  Serial.print(rainValue);
  Serial.print(", V=");
  Serial.print(rainVoltage);
  Serial.print(") | D0=");
  Serial.print(rainDigitalState == 0 ? "MOJADO" : "SECO");

  Serial.print(" | Luz: ");
  Serial.print(lightPercent);
  Serial.print("%");

  Serial.print(" | Boton: ");
  Serial.print(buttonState == LOW ? "PRES" : "LIBRE");

  Serial.print(" | Temp: ");
  Serial.print(tempC);
  Serial.print(" C");

  Serial.print(" | P: ");
  Serial.print(pres_hPa);
  Serial.print(" hPa");

  Serial.print(" | Dist: ");
  if (measure.RangeStatus != 4) {
    Serial.print(dist_bruta);
    Serial.print("mm (corr=");
    Serial.print(dist_corr);
    Serial.print("mm)");
  } else {
    Serial.print("Fuera de rango");
  }
  Serial.println();

  // ========================
  // OLED — Mostrar datos
  // ========================
  display.clearDisplay();
  display.setCursor(0,0);

  display.print("Lluv: ");
  display.print(rainPercent);
  display.println("%");

  display.print("D0: ");
  display.println(rainDigitalState == 0 ? "MOJADO" : "SECO");

  display.print("Luz: ");
  display.print(lightPercent);
  display.println("%");

  display.print("Temp: ");
  display.print(tempC, 1);
  display.println(" C");

  display.print("Pres: ");
  display.print(pres_hPa, 1);
  display.println(" hPa");

  display.print("Dist: ");
  if (measure.RangeStatus != 4) {
    display.print(dist_corr);
    display.println(" mm");
  } else {
    display.println("Fuera rng");
  }

  display.display();

  // ========================
  // BUZZER — cada 5 segundos
  // ========================
  static unsigned long t = 0;
  if (millis() - t > 5000) {
    t = millis();
    playMario();
  }

  delay(200);
}

// ======================================
// === MARIO THEME ===
// ======================================
void playMario() {
  for (int i = 0; i < 16; i++) {
    int duration = 1000 / noteDurations[i];

    if (melody[i] != 0)
      tone(BUZZER, melody[i], duration);
    else
      noTone(BUZZER);

    delay(duration * 1.3);
  }
  noTone(BUZZER);
}
