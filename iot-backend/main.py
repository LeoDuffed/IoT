from datetime import datetime
from decimal import Decimal
import os
from typing import Any, Optional, List
import asyncio

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import Error

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# FUNCIONES DE BASE DE DATOS
# -------------------------------

def get_connection():
    return mysql.connector.connect(**DB_CONFIG, use_pure=True)

def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    if row is None:
        return None
    value = row.get("value")
    if isinstance(value, Decimal):
        value = float(value)

    time_value = row.get("time")
    if isinstance(time_value, datetime):
        time_value = time_value.isoformat()
    # 🔧 aquí había un typo: Node -> None
    elif time_value is not None:
        time_value = str(time_value)

    return {
        "id": row.get("id"),
        "value": value,
        "time": time_value,
    }

def get_latest_measurement(table_name: str) -> Optional[dict[str, Any]]:
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        query = f"""
            SELECT id, valor AS value, hora_medicion AS time
            FROM {table_name}
            ORDER BY id DESC
            LIMIT 1;
        """
        cursor.execute(query)
        row = cursor.fetchone()
        return normalize_row(row) if row else None
    except Error as e:
        print(f"[MySQL Error] {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_measurements(table_name: str, limit: int = 200) -> List[dict[str, Any]]:
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        # Traemos las últimas `limit` mediciones y luego las ordenamos cronológicamente
        query = f"""
            SELECT id, valor AS value, hora_medicion AS time
            FROM {table_name}
            ORDER BY id DESC
            LIMIT %s;
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall() or []
        normalized = [normalize_row(r) for r in rows]
        # Las devolvemos ascendente en el tiempo
        normalized.reverse()
        return normalized
    except Error as e:
        print(f"[MySQL Error] {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# -------------------------------
# ENDPOINTS REST PARA HISTÓRICO
# -------------------------------

@app.get("/temperatura")
def list_temperatura(limit: int = 200):
    return get_measurements("temperatura", limit)

@app.get("/humedad")
def list_humedad(limit: int = 200):
    return get_measurements("humedad", limit)

@app.get("/presion")
def list_presion(limit: int = 200):
    return get_measurements("presion", limit)

@app.get("/luz")
def list_luz(limit: int = 200):
    return get_measurements("luz", limit)

@app.get("/gas")
def list_gas(limit: int = 200):
    return get_measurements("gas", limit)

# -------------------------------
# WEBSOCKET TIEMPO REAL
# -------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Cliente conectado")

    try:
        while True:
            payload = {
                "temperatura": get_latest_measurement("temperatura"),
                "humedad": get_latest_measurement("humedad"),
                "presion": get_latest_measurement("presion"),
                "luz": get_latest_measurement("luz"),
                "gas": get_latest_measurement("gas"),
            }

            await websocket.send_json(payload)
            await asyncio.sleep(2)  # intervalo de actualización

    except WebSocketDisconnect:
        print("[WS] Cliente desconectado")

    except Exception as e:
        print(f"[WS] Error inesperado: {e}")
        try:
            await websocket.close()
        except:
            pass