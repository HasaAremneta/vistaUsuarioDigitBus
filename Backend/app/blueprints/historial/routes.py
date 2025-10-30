from flask import Blueprint, jsonify
from app.db.connection import connect_to_db

bp = Blueprint('historial', __name__, url_prefix='/historial')


def rows_to_dicts(cursor, rows):
    if not rows:
        return []
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in rows]

# GET /historial/tarjetas/<idPersonal> - Obtener el historial de tarjetas de un personal
@bp.get("/tarjetas/<idPersonal>")
def tarjetas_por_personal(idPersonal):
    try:
        id_personal = int(idPersonal)
    except ValueError:
        return jsonify({"error": "idPersonal es requerido y debe ser número"}), 400
    
    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM TARJETAS WHERE IDPERSONAL = ?", (id_personal,))
        rows = cursor.fetchall()
        data = rows_to_dicts(cursor, rows)
        return jsonify({"tarjetas": data}), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener tarjetas", "details": str(e)}), 500
    finally:
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()

# GET /historial/solicitudes/<idPersonal> - Obtener el historial de solicitudes de un personal
@bp.get("/recargas/<idTarjeta>")
def recargas_por_tarjeta(idTarjeta):
    # Validar basica de numero
    try:
        id_tarjeta = int(idTarjeta)
    except ValueError:
        return jsonify({"error": "idTarjeta es requerido y debe ser número"}), 400
    
    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        cursor.execute(
           """
            SELECT
                r.IDRECARGA,
                r.IDTARJETA,
                r.MONTO,
                r.TIPOTRANSACCION,
                r.STATUS,
                r.FECHARECARGA,
                e.NOMBREESTABLECIMIENTO
            FROM RECARGAS r
            LEFT JOIN ESTABLECIMIENTO e
                ON r.IDESTABLECIMIENTO = e.IDESTABLECIMIENTO
            WHERE r.IDTARJETA = ?
            ORDER BY r.FECHARECARGA DESC
            """,
            (id_tarjeta,)
        )
        rows = cursor.fetchall()
        data = rows_to_dicts(cursor, rows)
        return jsonify({"recargas": data}), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener recargas", "details": str(e)}), 500
    finally:
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
            
