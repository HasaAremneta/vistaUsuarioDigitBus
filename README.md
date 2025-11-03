# DigitBus – Backend (Migración a Flask)

---

## Descripción General
Este proyecto corresponde al **backend de la aplicación web DigitBus**, desarrollada para la gestión integral de tarjetas **Pagobus**.  
El sistema permite realizar operaciones como **solicitudes**, **renovaciones**, **extravíos**, **recargas** y **pagos en línea**.  
El backend fue originalmente desarrollado en **Node.js con Express** y ha sido **migrado completamente a Flask (Python)**, manteniendo la conexión con **SQL Server** y la compatibilidad con el nuevo frontend en **Angular**.

---

## Estado Actual del Proyecto
- Migración completa de Node.js a Flask.  
- Conexión funcional a base de datos SQL Server mediante `pyodbc`.  
- Sistema de autenticación implementado con JWT.  
- Envío de correos electrónicos para recuperación de contraseñas (SMTP Gmail).  
- Integración de Stripe para pagos en línea.  
- Estructura modular organizada mediante Blueprints.  
- Configuración centralizada mediante archivo `.env`.  
- Pendiente: integración y pruebas finales con el frontend Angular.

---

## Estructura del Proyecto
app/  
├── __init__.py  
├── db/  
│   ├── __init__.py  
│   └── connection.py  
├── middlewares/  
│   ├── __init__.py  
│   └── auth_middleware.py  
├── services/  
│   ├── __init__.py  
│   └── mailer.py  
└── blueprints/  
    ├── auth/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── usuarios/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── solicitudes/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── historial/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── recuperar/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── payment/  
    │   ├── __init__.py  
    │   └── routes.py  
    ├── recargas/  
    │   ├── __init__.py  
    │   └── routes.py  
    └── renovacionYextravios/  
        ├── __init__.py  
        └── routes.py  

.env  
requirements.txt  
README.md  

---

## Instalación y Configuración
python -m venv .venv  
.venv\Scripts\activate  
pip install -r requirements.txt  

---

## Archivo .env
SECRET_KEY=aS3cR3tK3y!2025@MiApp  
API_KEY=sk_test_xxx  
EMAIL_USER=digitbusutl@gmail.com  
EMAIL_PASS=ozwu tzpu nxfg zskg  
FRONTEND_BASE_URL=http://localhost:4200  
DB_SERVER=DESKTOP-3HJ2A4F  
DB_NAME=DigitBusProd  
DB_USER=sa  
DB_PASSWORD=Hassael24.  
DRIVER=ODBC Driver 17 for SQL Server  
STRIPE_SUCCESS_URL=http://localhost:5173/PaymentSuccess  
STRIPE_CANCEL_URL=http://localhost:5173/pago-sucursal  

---

## Conexión a la Base de Datos
Archivo: app/db/connection.py  

import pyodbc, os  

def connect_to_db():  
    connection = pyodbc.connect(  
        f"DRIVER={{{os.getenv('DRIVER')}}};"  
        f"SERVER={os.getenv('DB_SERVER')};"  
        f"DATABASE={os.getenv('DB_NAME')};"  
        f"UID={os.getenv('DB_USER')};"  
        f"PWD={os.getenv('DB_PASSWORD')};"  
        "TrustServerCertificate=yes;"  
    )  
    return connection  

---

## Seguridad y Autenticación (JWT)
El middleware auth_middleware.py valida los tokens JWT.  
Las rutas protegidas utilizan el decorador @authenticate_token.  
El usuario autenticado se almacena en g.usuario para acceder a su información.

---

## Módulos del Sistema
| Módulo | Descripción | Rutas principales |
|--------|--------------|------------------|
| **auth** | Inicio de sesión y generación de tokens JWT. | `/auth/login` |
| **usuarios** | Registro y gestión de usuarios, actualización de perfil y contraseñas. | `/usuarios/registro`, `/usuarios/actualizarPassword` |
| **solicitudes** | Creación de solicitudes nuevas con documentación en formato Base64. | `/solicitudes/crear` |
| **historial** | Consulta de tarjetas y recargas históricas. | `/historial/tarjetas/<idPersonal>` |
| **recuperar** | Recuperación de contraseñas mediante enlace enviado por correo. | `/recuperar/solicitar`, `/recuperar/restablecer` |
| **payment** | Pagos en línea y actualización de saldo con Stripe. | `/payment/create-checkout-session`, `/payment/success` |
| **recargas** | Recargas manuales, beneficios y validación del esquema de BD. | `/recargas/`, `/recargas/beneficios`, `/recargas/validar/esquema` |
| **renovacionYextravios** | Solicitudes de renovación y reporte de extravíos de tarjetas. | `/renovacionYextravios/renovacion`, `/renovacionYextravios/extravios` |

---

## Envío de Correos Electrónicos
Archivo: app/services/mailer.py  

Usa el servicio SMTP Gmail.  
Envía un correo de recuperación con un enlace de restablecimiento de contraseña.  
El enlace apunta al frontend de Angular:  
http://localhost:4200/reset-password?token=<token>  

---

## Pagos con Stripe
Archivo: app/blueprints/payment/routes.py  

Genera sesiones de pago con Stripe Checkout.  
Registra las recargas en la base de datos al completar el pago.  
Actualiza automáticamente el saldo de la tarjeta.  
Las URLs de éxito y cancelación se configuran en el archivo .env.  

STRIPE_SUCCESS_URL=http://localhost:5173/PaymentSuccess  
STRIPE_CANCEL_URL=http://localhost:5173/pago-sucursal  

# Equipo de Desarrollo

---

**Proyecto:** DigitBus  
**Institución:** Universidad Tecnológica de León  
**Materia:** Gestion de Proyectos 2

---

## Integrantes
- Eduardo Hassael Sandoval Armenta  
- Guillermo Chávez Jiménez  
- José Carlos Camarena Hernández  
- Hugo Santiago Hernández Sánchez  

---

**Docente:** Juan Reynoso Neri
