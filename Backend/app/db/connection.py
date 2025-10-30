import os
import pyodbc
from dotenv import load_dotenv

#Cargamos las variables de entorno desde el archivo .env
load_dotenv()

DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DRIVER = os.getenv("DB_DRIVER")
DB_TRUST_CERT = os.getenv("DB_TRUST_CERT")

# Construimos la cadena de conexión
connection_string = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    f"TrustServerCertificate={DB_TRUST_CERT};"
)
#Función para conectar a la base de datos 
def connect_to_db():
    """Crea y devuelve una conexión activa a la base de datos."""
    try:
        conn = pyodbc.connect(connection_string)# Establece la conexión
        print("Conexión a la base de datos exitosa.")
        return conn
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return e



#Pruebas de la conexión  
# def execute_query(query, params=None):
#     """
#     Ejecuta una consulta y devuelve los resultados.
#     query: string SQL
#     params: tupla o lista de parámetros opcionales
#     """
#     try:
#         conn = connect_to_db()
#         cursor = conn.cursor()
#         cursor.execute(query, params or [])
#         try:
#             results = cursor.fetchall()
#         except pyodbc.ProgrammingError:
#             results = []
#         conn.commit()
#         cursor.close()
#         conn.close()
#         return results
#     except Exception as e:
#         print("Error ejecutando la consulta:", e)
#         raise e