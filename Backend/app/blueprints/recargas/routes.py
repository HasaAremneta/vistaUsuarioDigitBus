from flask import Blueprint, request, jsonify , g
from app.db.connection import connect_to_db
from datetime import datetime

bp = Blueprint("recargas", __name__, url_prefix="/recargas")

def row_to_dicts(cursor, rows):
    if not rows:
        return[]
    cols = [c[0] for c in cursor.description]
    return[dict(zip(cols, r)) for r in rows]

# POST /recargas  - Crear nueva recarga
@bp.post("/")
def crear_recargas():
    data = request.get_json(silent=True) or {}
    id_tarjeta = data.get("idTarjetas")
    monto = data.get("monto")
    
    id_usuario = getattr(getattr(g, "usuario", {}), "get", lambda *_: None)("id") or 1
    
    if id_usuario is None or monto is None:
        return jsonify({"ok": False, "message": "Faltan idTarjeta y monto"}), 400
    
    try:
        id_tarjeta = int(id_tarjeta)
        monto = float(monto)
    except Exception:
        return jsonify({"ok": False, "message": "idTarjeta debe ser entero y monto numérico"}), 400
    
    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        