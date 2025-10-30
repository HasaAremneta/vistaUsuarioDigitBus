import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Cargamos las variables de entorno desde el archivo .env
load_dotenv()

# Configuración del servidor de correo
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT")) 
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

def enviar_correo_reset(email:str, token:str, base_url:str):
    """
    Envía el correo de restablecimiento de contraseña
    base_url: URL del frontend que recibe el token (ajústala a Angular cuando migres).
    """
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        raise RuntimeError("Las credenciales de correo no están configuradas correctamente.")
    
    # Construir la URL de restablecimiento de contraseña
    reset_url = f"{base_url.rstrip('/')}/reset-password?token={token}"

    # Crear el mensaje de correo    
    msg = EmailMessage()
    msg['Subject'] = 'Restablecimiento de contraseña'
    msg['From'] = MAIL_DEFAULT_SENDER
    msg['To'] = email
    msg.set_content(
                "Hola, has solicitado restablecer tu contraseña.\n"
        "Haz clic en el siguiente enlace para cambiarla. Este enlace expirará en 15 minutos:\n"
        f"{reset_url}\n"
    )

    # Enviar el correo
    try:
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(MAIL_USERNAME, MAIL_PASSWORD)
            smtp.send_message(msg)
        print(f"Correo de restablecimiento enviado a {email}")
    except Exception as e:
        print(f"Error al enviar el correo: {e}")
        raise RuntimeError("No se pudo enviar el correo de restablecimiento.")
    
    return {"ok":True, "to":email}