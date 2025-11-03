import os
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
        
        # 1) Verificar propiedad de la tarjeta (TARJETAS ↔ USUARIOS)
        cursor.execute(
            """
            SELECT T.IDTIPOBENEFICIO
            FROM TARJETAS T
            JOIN USUARIOS U ON T.IDUSUARIO = U.IDUSUARIO
            WHERE T.IDTARJETA = ? AND U.IDUSUARIO = ?
            """,
            (id_tarjeta, id_usuario)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"ok": False, "message": "Tarjeta no válida"}), 403
        
        id_tipo_beneficio = row[0]
        descuento = 0.0

        # 2) Verificar establecimiento disponible (tomar uno activo)
        cursor.execute(
            """
            SELECT TOP 1 IDESTABLECIMIENTO
            FROM ESTABLECIMIENTOS
            WHERE ACTIVO = 1 OR ACTIVO = 'true' OR ACTIVO = 'ACTIVO'
            """
        )
        est = cursor.fetchone()
        if not est:
            return jsonify({"ok": False, "message": "No hay establecimientos disponibles"}), 400
        id_establecimiento = est[0]

        # 3) Calcular descuento según beneficio (si existe y está activo)
        if id_tipo_beneficio:
            cursor.execute(
                """
                SELECT NOMBRE
                FROM TIPOS_BENEFICIO
                WHERE IDTIPOBENEFICIO = ?
                  AND (ACTIVO = 1 OR ACTIVO = 'true' OR ACTIVO = 'ACTIVO' OR ACTIVO = '1')
                """,
                (id_tipo_beneficio,) 
            )

            ben = cursor.fetchone()
            if ben:
                nombre_beneficio = str(ben[0]).strip()
                if nombre_beneficio == "Estudiante":
                    descuento = monto * 0.10
                elif nombre_beneficio == "Personas de la tercera edad":
                    descuento = monto * 0.15
                elif nombre_beneficio == "Personas con discapacidad":
                    descuento = monto * 0.20
            
        monto_final = monto - descuento
        
        # 4) Registrar recarga y obtener ID
        reg_er = f"APP_RECARGA_{id_usuario}"
        cursor.execute(
            """
            DECLARE @Inserted TABLE(IDRECARGA INT);
            INSERT INTO RECARGAS (
                IDTARJETA,
                IDESTABLECIMIENTO,
                MONTO,
                TIPOTRANSACCION,
                STATUS,
                REGERAOR,
                FECHARECARGA
            )
            OUTPUT INSERTED.IDRECARGA INTO @Inserted
            VALUES (?, ?, ?, 'RECARGA', 'COMPLETADA', ?, GETDATE());
            SELECT IDRECARGA FROM @Inserted;
            """,
            (id_tarjeta, id_establecimiento, round(monto, 2), reg_er) 
        )
        rid_row = cursor.fetchone()
        if not rid_row:
            raise RuntimeError("No se pudo recuperar id de recarga")
        id_recarga = int(rid_row[0])


        # 5) Actualizar saldo de la tarjeta
        cursor.execute(
            """
            UPDATE TARJETAS
            SET SALDO = ISNULL(SALDO, 0) + ?
            WHERE IDTARJETA = ?
            """,
            (round(monto_final, 2), id_tarjeta) 
        )
        conn.commit()
        cursor.close()
        conn.close()


        return jsonify({
            "ok": True,
            "recarga": {
                "id": id_recarga,
                "monto": float(monto),
                "descuento": float(round(descuento, 2)),
                "montoFinal": float(round(monto_final, 2)),
                "fecha": datetime.utcnow().isoformat() + "Z",
                "establecimiento": id_establecimiento
            }
        }), 200
    
    except Exception as e:
        try:
            conn and conn.rollback()
        except Exception:
            pass
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
        return jsonify({
            "ok": False,
            "message": "Error al procesar la recarga",
            "error": str(e) if os.getenv("FLASK_ENV") == "development" else None
        }), 500



# GET /recargas/tarjeta/<idTarjeta>  - Recargas de una tarjeta
@bp.get("/tarjeta/<idTarjeta>")
def recargas_por_tarjeta(idTarjeta):

    id_usuario = getattr(getattr(g, "usuario", {}), "get", lambda *_: None)("id") or 1

    try:
        id_tarjeta = int(idTarjeta)
    except ValueError:
        return jsonify({"ok": False, "message": "idTarjeta debe ser numérico"}), 400
    
    conn = None
    cursor = None

    try:
        conn = connect_to_db()
        cursor = conn.cursor()

        # Verificar propiedad de la tarjeta (TARJETAS ↔ USUARIOS)
        cursor.execute(
            """
            SELECT 1
            FROM TARJETAS T
            JOIN USUARIOS U ON T.IDUSUARIO = U.IDUSUARIO
            WHERE T.IDTARJETA = ? AND U.IDUSUARIO = ?
            """,
            (id_tarjeta, id_usuario) 
        )
        if not cursor.fetchone():
            return jsonify({"ok": False, "message": "Tarjeta no válida"}), 403
        
        # Obtener recargas de la tarjeta
        cursor.execute(
            """
            SELECT
              R.IDRECARGA,
              CAST(R.MONTO AS DECIMAL(10,2)) AS MONTO,
              R.FECHARECARGA,
              RTRIM(R.STATUS) AS STATUS,
              RTRIM(R.TIPOTRANSACCION) AS TIPOTRANSACCION,
              RTRIM(R.REGERAOR) AS REGERAOR,
              RTRIM(TB.NOMBRE) AS TIPO_BENEFICIO,
              E.NOMBRE AS ESTABLECIMIENTO
            FROM RECARGAS R
            LEFT JOIN TARJETAS T ON R.IDTARJETA = T.IDTARJETA
            LEFT JOIN TIPOS_BENEFICIO TB ON T.IDTIPOBENEFICIO = TB.IDTIPOBENEFICIO
            LEFT JOIN ESTABLECIMIENTOS E ON R.IDESTABLECIMIENTO = E.IDESTABLECIMIENTO
            WHERE R.IDTARJETA = ?
            ORDER BY R.FECHARECARGA DESC
            """,
            (id_tarjeta,)
        )
        rows = cursor.fetchall()
        data = row_to_dicts(cursor, rows)
        #Asegurar MONTO como float

        for r in data:
            if "MONTO" in r and r["MONTO"] is not None:
                r["MONTO"] = float(r["MONTO"])
        
        cursor.close()
        conn.close()
        return jsonify({"ok": True, "recargas": data}), 200
    
    except Exception as e:
        try:
            conn and conn.rollback()
        except Exception:
            pass
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
        return jsonify({
            "ok": False,
            "message": "Error al obtener recargas",
            "error": str(e) if os.getenv("FLASK_ENV") == "development" else None
        }), 500
    

# GET /recargas/beneficios  - Lista de beneficios activos
@bp.get("/beneficios")
def listar_beneficios():
    conn = None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
              IDTIPOBENEFICIO AS id,
              RTRIM(NOMBRE) AS nombre,
              RTRIM(DESCRIPCION) AS descripcion
            FROM TIPOS_BENEFICIO
            WHERE ACTIVO = '1' OR ACTIVO = 'true' OR ACTIVO = 'ACTIVO' OR ACTIVO = 1
            """
        )
        rows = cursor.fetchall()
        data = row_to_dicts(cursor, rows)
        cursor.close()
        conn.close()
        return jsonify({"ok": True, "beneficios": data}), 200
    
    except Exception as e:
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
        return jsonify({"ok": False, "message": "Error al obtener beneficios",
                        "error": str(e) if os.getenv("FLASK_ENV") == "development" else None}), 500
    
# GET /recargas/validar/esquema  - Chequeo rápido de tablas/estado
@bp.get("/validar/esquema")
def validar_esquema():
    conn = None
    cursor = None

    try:
        conn = connect_to_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT 
              (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RECARGAS') AS tabla_recargas,
              (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ESTABLECIMIENTOS') AS tabla_establecimientos,
              (SELECT COUNT(*) FROM ESTABLECIMIENTOS WHERE ACTIVO = 1 OR ACTIVO = 'true') AS establecimientos_activos,
              (SELECT COUNT(*) FROM TIPOS_BENEFICIO WHERE ACTIVO = 1 OR ACTIVO = 'true') AS beneficios_activos
            """  
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"ok": False, "message": "No se pudieron obtener las validaciones"}), 500
        
        tabla_recargas,tabla_est,est_activos,ben_activos = row
        return jsonify({
            "ok": True,
            "esquema": {
                "tablas_existen": (tabla_recargas > 0 and tabla_est > 0),
                "establecimientos_disponibles": int(est_activos or 0),
                "beneficios_disponibles": int(ben_activos or 0),
                "listo_para_operaciones": (tabla_recargas > 0 and (est_activos or 0) > 0)
            }
        }), 200
    except Exception as e:
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
        return jsonify({"ok": False, "message": "Error al validar esquema de base de datos"}), 500
