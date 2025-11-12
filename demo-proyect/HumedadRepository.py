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
        # Metodo para insertar alumnos a la db
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            query = "insert into humedad (humedad,fecha) values (%s, %s)"
            cursor.execute(query, (humeadd, datetime.now))
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

    def get_alumnos(self):
        alumnos = []
        connection = None
        cursor = None
        try: 
            connection = self.get_connection()
            cursor = connection.cursor()
            query = "SELECT * FROM alumnos"
            cursor.execute(query)
            alumnos = cursor.fetchall()
            return alumnos
        except Error as e:
            print(f"Error al obtener alumnos: {e}")
            return alumnos
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
                
    def get_alumno_by_id(self, alumno_id):
        connection = None
        cursor = None
        try: 
            connection = self.get_connection()
            cursor = connection.cursor()
            query = "SELECT * FROM alumnos WHERE id = %s"
            cursor.execute(query, (alumno_id,))
            alumnos = cursor.fetchone()
            return alumnos
        except Error as e:
            print(f"Error al obtener alumnos: {e}")
            return alumnos
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
                
    def update_alumno_carrera_by_id(self, alumno_id, nueva_carrera):
        # Actualiza la carrera de un alumno por id
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            query = "UPDATE alumnos SET carrera = %s WHERE id = %s"
            cursor.execute(query, (nueva_carrera, alumno_id))
            connection.commit()
            return cursor.rowcount > 0
        except Error as e:
            print(f"Error al actualizar carrera: {e}")
            return False
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

    
