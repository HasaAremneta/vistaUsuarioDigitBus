from app.db import connect_to_db, execute_query

conn = connect_to_db()
print("✅ Conexión exitosa a SQL Server")
conn.close()

# Prueba de consulta
results = execute_query("SELECT TOP 3 * FROM USUARIOS")
print(results)