import mysql.connector
from mysql.connector import Error
from datetime import datetime

class HumedadRepository:
    def __init__(self):
        self.config = {
            "host":"localhost",
            "user":"root",
            "password":"leonardo",
            "database":"demoProyectoIoT"
        }
        
    def get_connection(self): 
        # Crea y devuelve una conexion a la db
        return mysql.connector.connect(**self.config)
    
    def insert_data(self, humedad): 
        # Metodo para insertar registros de humedad en la db
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            # Unificamos el nombre de la tabla a 'humedades'
            query = "INSERT INTO humedades (humedad, fecha) VALUES (%s, %s)"
            cursor.execute(query, (humedad, datetime.now()))
            connection.commit()
        except Error as e:
            print(f"Error al insertar: {e}")
        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if connection is not None:
                try:
                    if connection.is_connected():
                        connection.close()
                except Exception:
                    pass

    def get_humedad(self):
        valores = []
        connection = None
        cursor = None
        try: 
            connection = self.get_connection()
            # Retorna diccionarios para facilitar la serializacion en FastAPI
            cursor = connection.cursor(dictionary=True)
            query = "SELECT * FROM humedades"
            cursor.execute(query)
            valores = cursor.fetchall()
            return valores
        except Error as e:
            print(f"Error al obtener: {e}")
            return valores
        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if connection is not None:
                try:
                    if connection.is_connected():
                        connection.close()
                except Exception:
                    pass
                
    
