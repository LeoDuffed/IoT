from datetime import datetime


def _import_mysql():
    """Carga perezosa del conector MySQL con mensaje claro si falta."""
    try:
        import mysql.connector  # type: ignore
        from mysql.connector import Error  # type: ignore
        return mysql.connector, Error
    except Exception as e:
        raise ImportError(
            "Falta instalar 'mysql-connector-python'. Instálalo con: pip install mysql-connector-python"
        ) from e

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
        mysql, _ = _import_mysql()
        return mysql.connect(**self.config)
    
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
        except Exception as e:
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
        except Exception as e:
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
                
    
