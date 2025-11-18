from datetime import datetime
from decimal import Decimal
import os
from typing import Any, List
import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import Error
from pydantic import BaseModel

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
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

class HumedadPoint(BaseModel):
    value: float
    time: str

class TemperaturaPoint(BaseModel):
    value: float
    time: str

class PresionPoint(BaseModel):
    value: float
    time: str

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    value = row.get("value")
    if isinstance(value, Decimal):
        value = float(value)

    time_value = row.get("time")
    if isinstance(time_value, datetime):
        time_value = time_value.isoformat()
    elif time_value is not None:
        time_value = str(time_value)

    return {"value": value, "time": time_value}


def fetch_measurements(table_name: str, limit: int = 200) -> list[dict[str, Any]]:
    if table_name not in {"humedad", "temperatura", "presion"}:
        raise ValueError("Tabla no permitida")

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        query = f"""
            SELECT 
                valor AS value,
                hora_medicion AS time
            FROM {table_name}
            ORDER BY hora_medicion ASC
            LIMIT %s;
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        return [normalize_row(row) for row in rows]
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/humedad", response_model=List[HumedadPoint])
def get_humedad():
    return fetch_measurements("humedad")


@app.get("/temperatura", response_model=List[TemperaturaPoint])
def get_temperatura():
    return fetch_measurements("temperatura")

@app.get("/presion", response_model=List[TemperaturaPoint])
def get_temperatura():
    return fetch_measurements("presion")
