from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app.db.connection import connect_to_db
from app.middlewares import token_required

bp = Blueprint('solicitudes', __name__, url_prefix='/solicitudes')

@bp.post("/crear")
@token_required
def crear_solicitud():
    """
    Crea una solicitud y guarda su documentación en base64.
    Espera en body: { tipo, observaciones (opcional), documentos: [{tipo, base64Data}, ...] }
    Requiere JWT; toma idPersonal desde g.usuario.idPersonal
    """
    data = request.get_json(silent=True) or {}
    tipo = data.get('tipo')
    documentos = data.get('documentos', [])
    observaciones = data.get('observaciones')

    #Del token extraemos el idPersonal
    usuario = getattr(g, "usuario",{})or {}
    id_personal = usuario.get("idPersonal")

    if not id_personal:
        return jsonify({"success": False, "message": "idUsuario no encontrado en el token"}), 400
    
    if not tipo or not isinstance(documentos,list):
        return jsonify({"success": False, "message": "Faltan datos: tipo y/o documentos[]"}), 400
    
    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()

        #Verificamos que el personal exista
        cursor.execute(
            """
            SELECT p.IDPERSONAL
            FROM PERSONAL p
            JOIN USUARIOS u ON u.NOMBREUSUARIO = p.NOMBREUSUARIO
            WHERE p.IDPERSONAL = ?
            """,
            (id_personal,)
        )
        row = cursor.fetchone()
        if not row:
            if cursor: cursor.close()
            if conn: conn.close()
            return jsonify({"success": False, "message": "Personal no encontrado"}), 400
        
        #Se crea la solicitud
        cursor.execute(
            """
            INSERT INTO SOLICITUDES (IDPERSONAL, TIPOTABLETA, FECHASOLICITUD, STATUS, TIPOSOLICITUD)
            OUTPUT INSERTED.IDSOLICITUD
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                int(id_personal),
                str(tipo),
                datetime.now(),
                "Pendiente",
                "Nueva",
            )
        )
        row = cursor.fetchone()

        if not row:
            raise RuntimeError("No se pudo recuperar IDSOLICITUD insertado")
        id_solicitud = row[0]

        # Procesar documentos del body → mapear a columnas
        #    En tu Node:
        #      - 'foto'              -> TARJETA
        #      - 'comprobante'/'discapacidad' -> CONSTANCIA
        #      - 'identificación'    -> VAUCHES
        doc ={
            "TARJETA": None,
            "CONSTANCIA": None,
            "VAUCHES": None
        }
        for archivo in documentos:
            tipo_arch = (archivo.get('tipo') or '').lower().strip()
            base64_data = archivo.get('base64Data')
            if not base64_data:
                continue
            if tipo_arch == 'foto':
                doc["TARJETA"] = base64_data
            elif tipo_arch in ['comprobante', 'discapacidad']:
                doc["CONSTANCIA"] = base64_data
            elif tipo_arch in ['identificación', 'identificacion']:
                doc["VAUCHES"] = base64_data

        # Insertar documentos
        cursor.execute(
           """
            INSERT INTO DOCUMENTACION (IDSOLICITUD, TARJETAS, CONSTANCIA, VAUCHES)
            VALUES (?, ?, ?, ?)
            """,
            (id_solicitud, doc["TARJETA"], doc["CONSTANCIA"], doc["VAUCHES"])
        )

        conn.commit()
        if cursor: cursor.close()
        if conn: conn.close()

        return jsonify({"success": True, "idSolicitud": id_solicitud}), 200
    except Exception as e:
        if conn:
            try: conn.rollback()
            except Exception: pass
        if cursor:
            try: cursor.close()
            except Exception: pass
        if conn:
            try: conn.close()
            except Exception: pass
        
        print("Error al crear solicitud:", e)
        return jsonify({"success": False, "message": "Error al crear solicitud", "details": str(e)}), 500


# Alias: aceptar POST directamente en /solicitudes (sin /crear)
# Algunas llamadas del frontend pueden apuntar a /solicitudes en lugar de /solicitudes/crear.
# Añadimos una ruta corta que delega en la misma lógica para evitar errores de preflight/404.
@bp.post("")
@bp.post("/")
@token_required
def crear_solicitud_alias():
    return crear_solicitud()