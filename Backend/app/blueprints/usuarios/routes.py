from flask import Blueprint, request, jsonify
from datetime import datetime
import bcrypt
import pyodbc
from app.db.connection import connect_to_db

bp = Blueprint("usuarios", __name__, url_prefix="/usuarios")

def rows_to_dicts(cursor, rows):
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


#POST /usuarios - Crear un nuevo usuario
@bp.post("/registro")
def registro():
    data = request.get_json(silent=True) or {}
    required =[
        "NombreUsuario","Nombre","ApellidoPaterno","ApellidoMaterno",
        "DiaNacimiento","MesNacimiento","AnoNacimiento","Correo","password"
    ]

    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos requeridos: {', '.join(missing)}"}), 400
    
    try:
        #Fecha nacimiento YYYY-MM-DD (con ceros a la izquierda)
        fecha_nacimiento = f"{str(data['AnoNacimientOo']).zfill(4)}-{str(data['MesNacimiento']).zfill(2)}-{str(data['DiaNacimiento']).zfill(2)}"

        #Contraseña aceptada por bcrypt que pude tener caracteres especiales
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

        #Conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()

        #verificar si el nombre de usuario ya existe
        cursor.execute("SELECT 1 FROM USUARIOS WHERE NOMBREUSUARIO = ?", (data["NombreUsuario"],))
        existe = cursor.fetchone()
        if existe:
            cursor.close()
            conn.close()
            return jsonify({"message": "El nombre de usuario ya existe."}), 409
        
        #Insertar en la tabla PERSONAL
        cursor.execute(
            """"
            INSERT INTO PERSONAL (NOMBREUSUARIO, NOMBRE, APELLIDOPATERNO, APELLIDOMATERNO, FECHANACIMIENTO, CORREO)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                data["NombreUsuario"], data["Nombre"], data["ApellidoPaterno"],
                data["ApellidoMaterno"], fecha_nacimiento, data["Correo"] 
            )
        )

        #Insertar en la tabla USUARIOS
        cursor.execute(
            "INSERT INTO USUARIOS (NOMBREUSUARIO, PASSWORD) VALUES (?, ?)",
            (data["NombreUsuario"], hashed)
        )

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Usuario creado exitosamente."}), 201
    
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"error": "Error al registrar el usuario", "details": str(e)}), 500
    
# GET /usuarios/tarjetasU/<idPersonal> - Obtener las tarjetas de un usuario
@bp.get("/tarjetasU/<int:idPersonal>")
def tarjetas_usuario(idPersonal):
    try:
        #conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()

        # Consulta para obtener las tarjetas del usuario
        cursor.execute("SELECT * FROM TARJETAS WHERE IDPERSONAL = ?", (idPersonal,))
        rows = cursor.fetchall()
        data = rows_to_dicts(cursor, rows) if rows else []
        cursor.close()
        conn.close()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Error obteniendo tarjetas", "details": str(e)}), 500
    

#OST /usuarios/nuevaTarjeta - Agregar una nueva tarjeta para un usuario
@bp.post("/nuevaTarjeta")
def nueva_tarjeta():
    data = request.get_json(silent=True) or {}
    idPersonal = data.get("idPersonal")
    numTarjeta = data.get("numTarjeta")
    tipo = data.get("tipo")

    if not idPersonal or not numTarjeta or not tipo:
        return jsonify({"success": False, "message": "Faltan datos (idPersonal, numTarjeta, tipo)"}), 400
    
    try:
        from dateutil.relativedelta import relativedelta
        fecha_emision = datetime.now()
        fecha_vencimiento = fecha_emision + relativedelta(years=120)
    except Exception:
        from datetime import timedelta
        fecha_emision = datetime.now()
        fecha_vencimiento = fecha_emision + timedelta(days=120)

    try:
        #conexion a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()
        # Insertar la nueva tarjeta
        cursor.execute(
            """
            INSERT INTO TARJETAS (IDPERSONAL, TIPO, NUMTARJETA, FECHAEMISION, FECHAVECIMIENTO, SALDO, STATUS)
            VALUES (?, ?, ?, ?, ?, 0, 'ACTIVA')
            """,
            (int(idPersonal), str(tipo), str(numTarjeta), fecha_emision, fecha_vencimiento)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Tarjeta agregada exitosamente."}), 201
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"success": False, "message": "Error al crear tarjeta", "details": str(e)}), 500
    
#DELETE /usuarios/eliminarTarjeta/<idTarjeta> - Eliminar tarjetas 
@bp.delete("/eliminarTarjeta/<int:idTarjeta>")
def eliminar_tarjeta(idTarjeta):
    try:
        #Conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()
        #Eliminar la tarjeta
        cursor.execute("DELETE FROM TARJETAS WHERE IDTARJETA = ?", (idTarjeta,))
        affected = cursor.rowcount # puede dar -1 en algunos casos; en SQL Server suele devolver filas afectadas
        conn.commit()
        cursor.close()
        conn.close()

        if affected is None or affected <= 0:
            return jsonify({"success": False, "message": "No se encontró la tarjeta."}), 404
        
        return jsonify({"success": True, "message": "Tarjeta eliminada exitosamente."}), 200
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"success": False, "message": "Error al eliminar tarjeta", "details": str(e)}), 500
    

# POST /usuarios/validaPassword - Validar la contraseña de un usuario
@bp.post("/validaPassword")
def valida_password():
    data = request.get_json(silent=True) or {}
    nombre = data.get("nombre")
    password = data.get("password")
    if not nombre or not password:
        return jsonify({"message": "Faltan datos (nombre, password)"}), 400
    
    try:
        #conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()
        # Obtener la contraseña almacenada
        cursor.execute("SELECT PASSWORD FROM USUARIOS WHERE NOMBREUSUARIO = ?", (nombre,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"message": "Usuario no encontrado."}), 404
        
        hash_db = row[0]
        # Validar la contraseña
        try:
            is_valid = bcrypt.checkpw(password.encode("utf-8"), hash_db.encode("utf-8"))
        except Exception:
            is_valid = bcrypt.checkpw(password.encode("utf-8"), hash_db)

        return jsonify({"valid": bool(is_valid)}), 200
    
    except Exception as e:
        return jsonify({"error": "Error interno", "details": str(e)}), 500
    
# PATCH /usuarios/actualizarDatosPerfil - Actualizar datos del perfil de usuario
@bp.patch("/actualizarDatosPerfil")
def actualizar_datos_perfil():
    data = request.get_json(silent=True) or {}
    nombreActual = data.get("nombreUsuarioActual")
    nuevoNombre = data.get("nuevoNombreUsuario") or nombreActual
    correo = data.get("correo")

    if not nombreActual:
        return jsonify({"error": "Falta el nombre de usuario actual"}), 400
    
    try:
        #conexion a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()
        # Actualizar los datos del perfil

        cursor.execute(
            """
            UPDATE PERSONAL
            SET NOMBREUSUARIO = ?, CORREO = ?
            WHERE NOMBREUSUARIO = ?
            """,
            (nuevoNombre, correo, nombreActual)
        )
        affected_personal = cursor.rowcount

        #Actualizar en la tabla USUARIOS si el nombre de usuario cambió
        cursor.execute(
            """
            UPDATE USUARIOS
            SET NOMBREUSUARIO = ?
            WHERE NOMBREUSUARIO = ?
            """,
            (nuevoNombre, nombreActual)
        )
        affected_usuarios = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if(affected_personal or 0) <= 0 or (affected_usuarios or 0) <= 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        return jsonify({"success": True, "message": "Datos actualizados correctamente"}), 200
    
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"success": False, "error": "Error al actualizar datos de perfil", "details": str(e)}), 500

# PATCH /usuarios/actualizarPassword - Actualizar la contraseña de un usuario
@bp.patch("/actualizarPassword")
def actualizar_password():
    data = request.get_json(silent=True) or {}
    nombreUsuario = data.get("nombreUsuario")
    nuevaPassword = data.get("nuevaPassword")

    if not nombreUsuario or not nuevaPassword or not nuevaPassword.strip():
        return jsonify({"error": "Faltan datos para actualizar la contraseña"}), 400
    
    try:
        #generar el hash de la nueva contraseña
        hashed = bcrypt.hashpw(nuevaPassword.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
        #conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()
        # Actualizar la contraseña
        cursor.execute(
            """
            UPDATE USUARIOS
            SET PASSWORD = ?
            WHERE NOMBREUSUARIO = ?
            """,
            (hashed, nombreUsuario)
        )
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if (affected or 0) <= 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        return jsonify({"success": True, "message": "Contraseña actualizada correctamente"}), 200
    
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"success": False, "error": "Error al actualizar contraseña", "details": str(e)}), 500