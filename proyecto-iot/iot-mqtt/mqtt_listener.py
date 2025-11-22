# Este es un programa de prueba aun

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

# Broker MQTT
BROKER = "test.mosquitto.org"
PORT = 1883
TOPIC = "umisumi/test/message"     # == TOPIC del Arduino

# ---------------------------------------
# Función para conectar a MySQL
# ---------------------------------------
def get_connection():
    return mysql.connector.connect(**DB_CONFIG, use_pure=True)


# ---------------------------------------
# Función para insertar el mensaje a la BD
# ---------------------------------------
def insert_message(msg: str):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO mqtt_dummy (message, ts)
            VALUES (%s, NOW());
        """

        cursor.execute(query, (msg,))
        conn.commit()

        print(f"[SQL] Insertado en BD: {msg}")

    except Error as e:
        print(f"[MySQL ERROR] {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ---------------------------------------
# Callbacks MQTT
# ---------------------------------------
def on_connect(client, userdata, flags, rc):
    print("[MQTT] Conectado al broker con código:", rc)
    client.subscribe(TOPIC)
    print(f"[MQTT] Suscrito al tópico: {TOPIC}")


def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"[MQTT] Mensaje recibido: {payload}")

    # Guardar en la BD
    insert_message(payload)


# ---------------------------------------
# Inicializar cliente MQTT
# ---------------------------------------
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