from flask import Blueprint, request,jsonify
import os
import stripe
from app.db.connection import connect_to_db
from datetime import datetime

bp = Blueprint('payment', __name__, url_prefix='/payment')

# Config Stripe
STRIPE_API_KEY = os.getenv("API_KEY")
if not STRIPE_API_KEY:
    raise RuntimeError("Falta API_KEY en .env para Stripe")
stripe.api_key = STRIPE_API_KEY


# URLs de éxito/cancel (puedes moverlas a .env si quieres)
STRIPE_SUCCESS = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:5173/PaymentSuccess")
CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:5173/pago-sucursal")

@bp.get("/")
def home():
    return "Hello World!", 200

@bp.post("/create-checkout-session")
def create_checkout_session():
    data = request.get_json(silent=True) or {}
    monto = data.get("monto") #esperado en centavos para MXN si así lo manda tu frontend
    tarjeta = data.get("tarjeta") #esperado "sucursal" o "recarga"

    if monto is None or tarjeta is None:
        return jsonify({"error": "Faltan parámetros 'monto' o 'tarjeta'"}), 400
    
    try:
        session = stripe.checkout.Session.create(
            line_items=[{
                "price_data": {
                    "product_data": {
                        "name": "recargar de saldo",
                        "description": f"recarga de saldo para la tarjeta: {tarjeta}",
                    },
                    "currency": "mxn",
                    "unit_amount": int(monto),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=STRIPE_SUCCESS,
            cancel_url=CANCEL_URL,
        )
        return jsonify(session), 200
    except Exception as e:
        return jsonify({"error": "No se pudo crear la sesión de pago", "details": str(e)}), 500
    

@bp.post("/success")
def success():
    """
    Registra la recarga en BD y actualiza el saldo.
    Espera body: { idTarjeta, monto }
    - idTarjeta: int
    - monto: puede venir en pesos o centavos; aquí asumimos que es el mismo valor que
             cobraste en Stripe (si en Stripe fueron centavos, guarda centavos o convierte a pesos).
    """
    data = request.get_json(silent=True) or {}
    id_tarjeta = data.get("idTarjeta")
    monto = data.get("monto")

    if id_tarjeta is None or monto is None:
        return jsonify({"ok": False, "message": "Faltan idTarjeta y monto"}), 400
    

    # Aseguramos número
    try:
        id_tarjeta = int(id_tarjeta)
        monto_float = float(monto)
    except Exception:
        return jsonify({"ok": False, "message": "idTarjeta debe ser entero y monto numérico"}), 400
    

    conn =  None
    cursor = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()

        # Insert en RECARGAS y obtener IDRECARGA
        cursor.execute(
            """
            DECLARE @Inserted TABLE(IDRECARGA INT);
            INSERT INTO RECARGAS (
                IDTARJETA,
                IDESTABLECIMIENTO,
                MONTO,
                TIPOTRANSACCION,
                STATUS,
                FECHARECARGA
            )
            OUTPUT INSERTED.IDRECARGA INTO @Inserted
            VALUES (?, 0, ?, 'RECARGA', 'COMPLETADA', GETDATE());
            SELECT IDRECARGA FROM @Inserted;
            """,
            (id_tarjeta, round(monto_float, 2))
        )
        row = cursor.fetchone()
        if not row:
            raise RuntimeError("No se pudo recuperar ID de recarga insertado")
        id_recarga = row[0]

        # Actualizar saldo de la tarjeta
        cursor.execute(
            """
            UPDATE TARJETAS
            SET SALDO = ISNULL(SALDO, 0) + ?
            WHERE IDTARJETA = ?
            """,
            (monto_float, id_tarjeta)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "ok": True,
            "recarga": {
                "id": int(id_recarga),
                "monto": monto_float,
                "fecha": datetime.utcnow().isoformat() + "Z",
            }
        }),200
    
    except Exception as e:
        try:
            conn and conn.rollback()
        except Exception:
            pass
        try:
            cursor and cursor.close()
        finally:
            conn and conn.close()
        return jsonify({"ok": False, "message": "Error al registrar recarga", "details": str(e)}), 500
    

@bp.post("/cancel")
def cancel():
    return "cancel",200

