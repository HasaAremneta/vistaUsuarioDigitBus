from flask import Blueprint

from app.blueprints.auth import bp as auth_bp
from app.blueprints.usuarios import bp as usuarios_bp
from app.blueprints.solicitudes import bp as solicitudes_bp
from app.blueprints.historial import bp as historial_bp
from app.blueprints.payment import bp as payment_bp
from app.blueprints.recargas import bp as recargas_bp
from app.blueprints.recuperar import bp as recuperar_bp
from app.blueprints.renovacionYextravios import bp as renovacionYextravios_bp


blueprints = [
    auth_bp,
    usuarios_bp,
    solicitudes_bp,
    historial_bp,
    payment_bp,
    recargas_bp,
    recuperar_bp,
    renovacionYextravios_bp
]