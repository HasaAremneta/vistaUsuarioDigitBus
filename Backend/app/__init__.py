import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.blueprints import blueprints

def create_app():
    """Crea y configura la aplicación Flask principal de DigitBus"""
    load_dotenv() # Carga variables de entorno desde un archivo .env

    # Configuración básica de la aplicación
    app = Flask(__name__)

    #configuraciónes basicas
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "clave_insegura")
    app.config["ENV"] = os.getenv("FLASK_ENV", "development")
    app.config["DEBUG"] = app.config["ENV"] == "development"

    # Habilitar CORS (para permitir conexión desde Angular)
    # Puedes restringir a tu dominio de Angular si quieres:
    # CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Registrar blueprints
    for bp in blueprints:
        app.register_blueprint(bp)
    
    @app.route('/')
    def index():
        return {
            "message": "Bienvenido a la API de DigitBus",
            "status": "ok"
        }
    return app
    