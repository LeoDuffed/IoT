import time
import json
import random
from paho.mqtt import client as mqtt

# --- Configuración del broker ---
BROKER = "test.mosquitto.org"
PORT = 1883
TOPIC = "umisumi/test/message"  # mismo tópico que tu listener

# --- Configuración de los "sensores" simulados ---
SENSORES = {
    "humedad": {
        "min": 30,
        "max": 80,
        "unit": "%"
    },
    "temperatura": {
        "min": 18,
        "max": 32,
        "unit": "C"
    },
    "presion": {
        "min": 980,
        "max": 1030,
        "unit": "hPa"
    },
    "luz": {
        "min": 0,
        "max": 1023,
        "unit": "adc"
    },
    "gas": {
        "min": 100,
        "max": 400,
        "unit": "ppm"
    },
}


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Conectado al broker MQTT")
    else:
        print("⚠️ Error al conectar. Código:", rc)


def crear_cliente():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.connect(BROKER, PORT, keepalive=60)
    return client


def generar_valor(sensor_cfg):
    return round(random.uniform(sensor_cfg["min"], sensor_cfg["max"]), 2)


def main():
    client = crear_cliente()
    client.loop_start()  # mantiene la conexión

    try:
        while True:
            for sensor_type, cfg in SENSORES.items():
                valor = generar_valor(cfg)

                # 👇 ESTE ES EL JSON QUE VE TU LISTENER
                payload = {
                    "type": sensor_type,          # 👈 AHORA SE LLAMA "type"
                    "value": valor,               # lo conviertes a float en el listener
                    "unit": cfg["unit"],
                    "ts": int(time.time())
                }

                result = client.publish(TOPIC, json.dumps(payload))
                status = result[0]

                if status == 0:
                    print(f"📡 Enviado a {TOPIC}: {payload}")
                else:
                    print(f"❌ Error al publicar en {TOPIC}: {payload}")

                time.sleep(1.5)

            time.sleep(6)

    except KeyboardInterrupt:
        print("\n🛑 Simulador detenido por el usuario.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("🔌 Desconectado del broker.")


if __name__ == "__main__":
    main()