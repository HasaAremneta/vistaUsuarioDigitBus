import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv

# Cargamos las variables de entorno desde el archivo .env
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")

# Decorador para proteger rutas que requieren autenticación
def token_required(f):
    """
    Decorador que valida el JWT del header Authorization: Bearer <token>.
    Si es válido, coloca el payload en g.usuario y continúa con la vista.
    Si no, responde 401/403 con un mensaje en español.
    """
    #Autenticación con JWT y manejo de errores como tambien guardar el usuario en g.usuario
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"mensaje": "Token de autenticación no proporcionado o malformado."}), 401
        
        token = parts[1]
        if not SECRET_KEY:
            return jsonify({"mensaje": "Clave secreta no configurada en el servidor."}), 500
        
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.usuario = decoded  # Colocamos el payload en g.usuario
        except jwt.ExpiredSignatureError:
            return jsonify({"mensaje": "El token ha expirado. Por favor, inicia sesión nuevamente."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"mensaje": "Token inválido. Acceso no autorizado."}), 403
        
        return f(*args, **kwargs)
    return wrapped

# Decorador para rutas que no requieren autenticación
def get_current_user():
    """Helper para obtener el usuario del contexto (equivalente a req.usuario)."""
    return getattr(g, 'usuario', None)