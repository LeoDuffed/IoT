from datetime import datetime
import os
import json
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from paho.mqtt import client as mqtt

# ---------------------------------------
# Cargar variables del archivo .env
# ---------------------------------------
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

BROKER = "test.mosquitto.org"
PORT = 1883
TOPIC = "umisumi/test/message"

# Tablas permitidas (deben existir en tu BD)
ALLOWED_TABLES = {"humedad", "temperatura", "presion", "luz", "gas"}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG, use_pure=True)


def insert_measurement(sensor_type: str, value: float):
    """
    Inserta en la tabla correspondiente (temperatura, humedad, etc.)
    usando columnas: valor, hora_medicion.
    """
    if sensor_type not in ALLOWED_TABLES:
        print(f"[WARN] Tipo de sensor no permitido: {sensor_type}")
        return

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # OJO: el nombre de la tabla se inserta en el SQL ya validado
        query = f"""
            INSERT INTO {sensor_type} (valor, hora_medicion)
            VALUES (%s, NOW());
        """

        cursor.execute(query, (value,))
        conn.commit()

        print(f"[SQL] Insertado en tabla '{sensor_type}': {value}")

    except Error as e:
        print(f"[MySQL ERROR] {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def on_connect(client, userdata, flags, rc):
    print("[MQTT] Conectado al broker con código:", rc)
    client.subscribe(TOPIC)
    print(f"[MQTT] Suscrito al tópico: {TOPIC}")


def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"[MQTT] Mensaje recibido crudo: {payload}")

    try:
        data = json.loads(payload)

        sensor_type = data.get("type")
        value = float(data.get("value"))

        if sensor_type is None:
            print("[ERROR] No viene 'type' en el JSON")
            return

        insert_measurement(sensor_type, value)

    except (json.JSONDecodeError, TypeError, ValueError) as e:
        print(f"[ERROR] Problema parseando JSON o valor: {e}")


def main():
    client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message

    print("[MQTT] Conectando al broker...")
    client.connect(BROKER, PORT, keepalive=60)

    print("[MQTT] Escuchando mensajes...")
    client.loop_forever()


if __name__ == "__main__":
    main()