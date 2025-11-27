from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app.db.connection import connect_to_db
from app.middlewares import token_required
from flask_cors import cross_origin 

bp = Blueprint('renovacionYextravios', __name__, url_prefix='/renovacionYextravios')

# --- Helpers ---
def rows_to_dicts(cursor, rows):
    if not rows:
        return []
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in rows]

def check_personal_exists(conn, id_personal: int) -> bool:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT p.IDPERSONAL
        FROM dbo.PERSONAL p
        JOIN dbo.USUARIOS u ON u.NOMBREUSUARIO = p.NOMBREUSUARIO
        WHERE p.IDPERSONAL = ?
        """,
        (id_personal,) 
    )
    ok = cur.fetchone() is not None
    cur.close()
    return ok

def insert_solicitud(conn, id_personal: int, tipo_tablet: str, tipo_solicitud: str) -> int:
    """
    Inserta una solicitud y devuelve el ID generado
    """
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO dbo.SOLICITUDES (IDPERSONAL, TIPOTABLETA, FECHASOLICITUD, STATUS, TIPOSOLICITUD)
        OUTPUT INSERTED.IDSOLICITUD
        VALUES (?, ?, ?, 'Pendiente', ?)
        """,
        (id_personal, tipo_tablet, datetime.now(), tipo_solicitud)
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        raise RuntimeError("No se pudo recuperar IDSOLICITUD insertado")
    id_solicitud = row[0]
    cur.close()
    return int(id_solicitud)

def insert_documentos(conn, id_solicitud: int, tarjetas: str | None, constancia: str | None, vauches: str | None):
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO dbo.DOCUMENTACION (IDSOLICITUD, TARJETAS, CONSTANCIA, VAUCHES)
        VALUES (?, ?, ?, ?)
        """,
        (id_solicitud, tarjetas, constancia, vauches) 
    )
    cur.close()

# --- Rutas ---
# POST /renovacionYextravios/renovacion  (solo tipo ESTUDIANTE)
@bp.route('/renovacion', methods=['POST'])
@token_required
def renovacion():
    data = request.get_json(silent=True) or {}
    tipo = data.get('tipo')
    documentos = data.get('documentos', [])
    usuario = getattr(g, "usuario", {}) or {}
    id_personal = usuario.get("idPersonal")

    if not id_personal:
        return jsonify({"success": False, "message": "idUsuario no encontrado en el token"}), 400
    
    if tipo != "ESTUDIANTE":
        return jsonify({"success": False, "message": "La renovación solo aplica a Estudiante"}), 400
    
    conn = None
    try:
        conn = connect_to_db()
        if not check_personal_exists(conn, int(id_personal)):
            return jsonify({"success": False, "message": "Personal no encontrado"}), 400
        
        # 1) Insertar solicitud
        id_solicitud = insert_solicitud(conn, int(id_personal), tipo_tablet=tipo, tipo_solicitud="Renovación")

        # 2) Mapear documentos
        doc = {"TARJETAS": None, "CONSTANCIA": None, "VAUCHES": None}
        for a in documentos:
            t = (a.get("tipo") or "").lower().strip()
            b64 = a.get("base64Data")
            if not b64:
                continue
            if t == "comprobante":
                doc["CONSTANCIA"] = b64
            elif t == "foto":
                doc["TARJETAS"] = b64
            elif t in ["identificación", "identificacion"]:
                doc["VAUCHES"] = b64
        
        # 3) Insertar documentos
        insert_documentos(conn, id_solicitud, doc["TARJETAS"], doc["CONSTANCIA"], doc["VAUCHES"])

        conn.commit()
        return jsonify({"success": True, "idSolicitud": id_solicitud}), 200
    except Exception as e:
        try:
            conn and conn.close()
        except Exception:
            pass
        return jsonify({"success": False, "message": "Error al crear solicitud de extravío", "details": str(e)}), 500
    finally:
        try:
            conn and conn.close()
        except Exception:
            pass

# GET /renovacionYextravios/tarjetas/<idPersonal>
@bp.route('/tarjetas/<int:id_personal>')
@token_required
@cross_origin()
def tarjetas_por_personal(id_personal: int):
    try:
        id_p = int(id_personal)
    except ValueError:
        return jsonify({"success": False, "message": "idPersonal inválido (debe ser numérico)"}), 400

    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
              t.IDTARJETA,
              t.NUMTARJETA,
              t.FECHAEMISION,
              t.FECHAVECIMIENTO,
              t.STATUS,
              t.TIPO
            FROM dbo.TARJETAS t
            WHERE t.IDPERSONAL = ?
            """,
            (id_p,) 
        )
        rows = cursor.fetchall()
        data = rows_to_dicts(cursor, rows)

        if not data:
            return jsonify({"success": False, "message": "No se encontraron tarjetas para esta persona"}), 404

        return jsonify({"success": True, "tarjetas": data}), 200
    
    except Exception as e:
        print("ERROR EN TARJETAS:", e)
        return jsonify({"success": False, "message": "Error al obtener tarjetas", "details": str(e)}), 500
    finally:
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
