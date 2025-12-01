from flask import Blueprint, request, jsonify
import os
import jwt
from datetime import datetime, timedelta
import bcrypt
from app.db.connection import connect_to_db
from app.service import enviar_correo_reset

bp = Blueprint('recuperar', __name__, url_prefix='/recuperar')

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "clave_insegura"
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# POST /recuperar/solicitar
@bp.post('/solicitar')
def solicitar_recuperacion():
    data = request.get_json(silent=True) or {}
    correo = data.get('correo')

    if not correo:
        return jsonify({"error": "El campo 'correo' es obligatorio."}), 400
    
    conn = None
    cursor = None

    try:
        conn = connect_to_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT p.NOMBREUSUARIO
            FROM PERSONAL p
            JOIN USUARIOS u ON p.NOMBREUSUARIO = u.NOMBREUSUARIO
            WHERE p.CORREO = ?
            """,
            (correo,)
        )
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({"error": "No se encontró un usuario con ese correo."}), 404
        
        nombre_usuario = row.NOMBREUSUARIO if hasattr(row, 'NOMBREUSUARIO') else row[1]

        # Generar token con expiración de 15 minutos
        payload = {
            "usuario": nombre_usuario,
            "exp": datetime.utcnow() + timedelta(minutes=15),
            "iat": datetime.utcnow()
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        #Enviar correo (usando  nuestro servicio)
        enviar_correo_reset(correo,token,base_url=FRONTEND_BASE_URL)
        return jsonify({"mensaje": "Se ha enviado un correo para restablecer la contraseña."}), 200
    
    except Exception as e:
        import traceback
        print("❌ Error en /recuperar/solicitar:", e)
        traceback.print_exc()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        
        return jsonify({
            "error": "Error interno del servidor.",
            "details":str(e)
        }),500

    
# POST /recuperar/restablecer
@bp.post('/restablecer')
def restablecer_contraseña():
    data = request.get_json(silent=True) or {}
    token = data.get('token')
    nueva_password = data.get('nuevaPassword')

    if not token or not nueva_password or not nueva_password.strip():
        return jsonify({"error": "Los campos 'token' y 'nuevaPassword' son obligatorios."}), 400
    
    try:
        decode = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        usuario = decode.get("usuario")
        if not usuario:
            return jsonify({"error": "Token inválido(sin usuario)"}), 400
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido."}), 401
    
    # Hashear la nueva contraseña
    try:
        heashed = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
    except Exception:
        heashed = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt(rounds=10)) 

    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE USUARIOS
            SET PASSWORD = ?
            WHERE NOMBREUSUARIO = ?
            """,
            (heashed, usuario)
        )
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if(affected or 0) <= 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        return jsonify({"mensaje": "Contraseña restablecida exitosamente."}), 200
    
    except Exception as e:
        try:
            conn and conn.close()
        finally:
            cursor and cursor.close()
        return jsonify({"error": "Error al restablecer la contraseña", "details": str(e)}), 500