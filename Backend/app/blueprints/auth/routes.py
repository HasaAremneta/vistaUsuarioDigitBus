from flask import Blueprint, request, jsonify
import os
import jwt
from datetime import datetime, timedelta
import bcrypt
from app.db.connection import connect_to_db

bp = Blueprint('auth', __name__, url_prefix='/auth')

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")

@bp.route("/login",methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}
        nombre_usuario = data.get("NombreUsuario")
        password = data.get("password")

        if not nombre_usuario or not password:
            return jsonify({"message": "Nombre de usuario y contraseña son requeridos."}), 400
        
        #conexión a la base de datos
        conn = connect_to_db()
        cursor = conn.cursor()

        # Consulta para obtener el usuario
        query = """
            SELECT 
                u.IDUSUARIOS AS id_usuario,
                u.PASSWORD AS password_hash,
                p.IDPERSONAL AS id_personal,
                p.NOMBRE AS nombre,
                p.CORREO AS correo
            FROM USUARIOS u
            JOIN PERSONAL p ON u.NOMBREUSUARIO = p.NOMBREUSUARIO
            WHERE u.NOMBREUSUARIO = ?
        """
        cursor.execute(query, (nombre_usuario,))
        row = cursor.fetchone()

        #Ciere de la conexión
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"message": "Usuario o contraseña incorrectos."}), 401
        
        # Extracción de datos del usuario
        id_usuario = row.id_usuario
        password_hash = row.password_hash
        id_personal = row.id_personal
        nombre = row.nombre
        correo = row.correo

        # Verificación de la contraseña
        if not password_hash:
            return jsonify({"message": "Usuario o contraseña incorrectos."}), 500
        
        #validar contraseña con bcrypt
        try:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), password_hash)

        
        if not is_valid:
            return jsonify({"message": "Usuario o contraseña incorrectos."}), 401
        
        # Generación del token JWT
        payload = {
            "id_usuario": id_usuario,
            "id_personal": id_personal,
            "nombre": nombre,
            "correo": correo,
            "exp": datetime.utcnow() + timedelta(hours=1),  # Expira en 2 horas
            "iat": datetime.utcnow()
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        user = {
            "IDUSUARIOS": id_usuario,
            "IDPERSONAL": id_personal,
            "NOMBRE": nombre,
            "CORREO": correo
        }

        return jsonify({"message": "Inicio de sesión exitoso", "token":token, "user":user}), 200
    except Exception as e:
        print("Error al iniciar sesión:", e)
        return jsonify({"error": "Error al iniciar sesión", "details": str(e)}),


