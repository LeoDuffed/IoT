#include "WiFiS3.h"
#include <ArduinoMqttClient.h>

char ssid[] = "Tec-IoT";    // your network SSID (name)
char pass[] = "spotless.magnetic.bridge";    // your network password 

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);
  
const char broker[] = "test.mosquitto.org"; //IP address of the EMQX broker.
int        port     = 1883;
const char subscribe_topic[]  = "E6/test/log";
const char publish_topic[]  = "E6/test/message";

int temperature = 20;

void setup() {
  // Create serial connection and wait for it to become available.
  Serial.begin(9600);
  while (!Serial) {
    ; 
  }

  // Connect to WiFi
  Serial.print("Attempting to connect to WPA SSID: ");
  Serial.println(ssid);
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    // failed, retry
    Serial.print(".");
    delay(5000);
  }

  Serial.println("You're connected to the network");
  Serial.println();

  Serial.print("Attempting to connect to the MQTT broker.");

  if (!mqttClient.connect(broker, port)) {
    Serial.print("MQTT connection failed! Error code = ");
    Serial.println(mqttClient.connectError());
    while (1);
  }

  Serial.println("You're connected to the MQTT broker!");

  Serial.print("Subscribing to topic: ");
  Serial.println(subscribe_topic);
  // subscribe to a topic
  mqttClient.subscribe(subscribe_topic);

  // topics can be unsubscribed using:
  // mqttClient.unsubscribe(topic);

  Serial.print("Waiting for messages on topic: ");
  Serial.println(subscribe_topic);
}

void loop() {
  int messageSize = mqttClient.parseMessage();
  if (messageSize) {
    // we received a message, print out the topic and contents
    Serial.print("Received a message with topic '");
    Serial.print(mqttClient.messageTopic());
    Serial.print("', length ");
    Serial.print(messageSize);
    Serial.println(" bytes:");

    // use the Stream interface to print the contents
    while (mqttClient.available()) {
      Serial.print((char)mqttClient.read());
    }
    Serial.println();
  }

  // send message, the Print interface can be used to set the message contents
  delay(3000);
  Serial.println("sending to mqtt!");

  mqttClient.beginMessage(publish_topic);
  mqttClient.print("Hola chat ");
  mqttClient.println(random(1000)); //Random value!
  mqttClient.print(temperature);
  mqttClient.endMessage();
  
  temperature += 50;

}