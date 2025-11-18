from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os
from typing import List
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

app = FastAPI()

# Permitir llamadas desde tu frontend en http://localhost:3000
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

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

@app.get("/humedad", response_model=List[HumedadPoint])
def get_humedad():
    """
    Lee la tabla `humedad` en la base iot_db
    y regresa una lista [{value, time}, ...]
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # --------------------------------------------------------------------
        # Consulta SQL CORREGIDA: Usando 'valor' y 'hora_medicion'
        # --------------------------------------------------------------------
        query = """
            SELECT 
                valor           AS value,  -- El valor de la medición de humedad
                hora_medicion   AS time    -- La fecha y hora de la medición
            FROM humedad
            ORDER BY hora_medicion ASC -- Entregar datos ordenados cronológicamente
            LIMIT 200;
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        normalized = [
            {
                "value": row["value"],
                "time": row["time"].isoformat() if row["time"] else None,
            }
            for row in rows
        ]

        cursor.close()
        conn.close()
        return normalized
    except Error as e:
        print(f"Error al conectar a MySQL o ejecutar la consulta: {e}")
        # Si hay error, regresamos lista vacía (mejor que crashear)
        return []
