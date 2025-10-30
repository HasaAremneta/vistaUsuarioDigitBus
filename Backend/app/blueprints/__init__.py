from flask import Blueprint

from app.blueprints.auth import bp as auth_bp
from app.blueprints.usuarios import bp as usuarios_bp
from app.blueprints.solicitudes import bp as solicitudes_bp
from app.blueprints.historial import bp as historial_bp

blueprints = [
    auth_bp,
    usuarios_bp,
    solicitudes_bp,
    historial_bp,
]