from flask import Flask, jsonify
from app.middlewares import token_required, get_current_user
import jwt
import os

app = Flask(__name__)

# --- Clave para firmar el token ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "aS3cR3tK3y!2025@MiApp"

# --- Ruta pública ---
@app.route("/public")
def public():
    return jsonify({"mensaje": "Ruta pública sin token"}), 200

# --- Ruta protegida ---
@app.route("/protegida")
@token_required
def protegida():
    user = get_current_user()
    return jsonify({
        "mensaje": "Accediste con un token válido",
        "usuario": user
    }), 200

# --- Ruta para generar un token de prueba ---
@app.route("/token")
def generar_token():
    payload = {"idUsuario": 10, "nombre": "Hassael"}
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token})

if __name__ == "__main__":
    app.run(debug=True)
