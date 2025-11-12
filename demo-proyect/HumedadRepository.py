from contextlib import closing
from datetime import datetime
from typing import Dict, List, Optional, Set

try:
    import mysql.connector  # type: ignore
except ImportError as exc:  # pragma: no cover - se ejecuta solo si falta la dependencia
    raise ImportError(
        "Falta instalar 'mysql-connector-python'. Instálalo con: pip install mysql-connector-python"
    ) from exc


class HumedadRepository:
    def __init__(self) -> None:
        self._config = {
            "host": "localhost",
            "user": "root",
            "password": "leonardo",
            "database": "demoProyectoIoT",
        }
        self._table = "humedad"
        self._columns_cache: Optional[Set[str]] = None

    def _get_connection(self):
        return mysql.connector.connect(**self._config)

    def insert_data(self, humedad: float) -> None:
        columnas = ["humedad"]
        valores = [humedad]

        if "fecha" in self._get_table_columns():
            columnas.append("fecha")
            valores.append(datetime.now())

        columnas_sql = ", ".join(columnas)
        placeholders = ", ".join(["%s"] * len(valores))
        query = f"INSERT INTO {self._table} ({columnas_sql}) VALUES ({placeholders})"

        try:
            with closing(self._get_connection()) as connection, closing(connection.cursor()) as cursor:
                cursor.execute(query, tuple(valores))
                connection.commit()
        except Exception as exc:
            raise RuntimeError("Error al insertar en la base de datos") from exc

    def get_humedad(self) -> List[Dict[str, object]]:
        query = f"SELECT * FROM {self._table}"
        try:
            with closing(self._get_connection()) as connection, closing(
                connection.cursor(dictionary=True)
            ) as cursor:
                cursor.execute(query)
                return cursor.fetchall()
        except Exception as exc:
            raise RuntimeError("Error al obtener los registros de la base de datos") from exc

    def _get_table_columns(self) -> Set[str]:
        if self._columns_cache is not None:
            return self._columns_cache

        info_schema_query = """
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
        """
        try:
            with closing(self._get_connection()) as connection, closing(connection.cursor()) as cursor:
                cursor.execute(
                    info_schema_query,
                    (self._config["database"], self._table),
                )
                self._columns_cache = {row[0] for row in cursor.fetchall()}
                if not self._columns_cache:
                    raise RuntimeError(
                        f"La tabla '{self._table}' no tiene columnas visibles en INFORMATION_SCHEMA."
                    )
                return self._columns_cache
        except Exception as exc:
            raise RuntimeError("No se pudieron leer las columnas de la tabla 'humedad'") from exc
