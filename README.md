
<p align="center">
  <img src="../Frontend/src/assets/image/mi-logo.png" alt="San Diego Distribuidora" width="100" />
</p>

<h1 align="center">🐍 San Diego Distribuidora — Backend API</h1>
<p align="center">
  <strong>API RESTful para la gestión integral de distribuidora farmacéutica</strong>
  <br />
  <em>Flask · Python · MySQL · JWT · APScheduler</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.x-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/MySQL-10.4%2B-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/OpenAPI-3.0-6BA539?logo=openapi&logoColor=white" alt="OpenAPI" />
</p>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints de la API](#-endpoints-de-la-api)
  - [Autenticación](#autenticación)
  - [Usuarios y Roles](#usuarios-y-roles)
  - [Productos](#productos)
  - [Lotes](#lotes)
  - [Inventario](#inventario)
  - [Pedidos y Ventas](#pedidos-y-ventas)
  - [Facturación](#facturación)
  - [Clientes](#clientes)
  - [Compras](#compras)
  - [Proveedores](#proveedores)
  - [Devoluciones](#devoluciones)
  - [Reportes](#reportes)
  - [Alertas y Automatización](#alertas-y-automatización)
  - [Monitoría](#monitoría)
  - [Endpoints Públicos](#endpoints-públicos)
- [Modelo de Base de Datos](#-modelo-de-base-de-datos)
- [Autenticación JWT](#-autenticación-jwt)
- [Tareas Automáticas (Scheduler)](#-tareas-automáticas-scheduler)
- [Roles y Permisos](#-roles-y-permisos)
- [Manejo de Errores](#-manejo-de-errores)
- [Despliegue](#-despliegue)
- [Documentación Interactiva](#-documentación-interactiva)
- [Variables de Entorno](#-variables-de-entorno)

---

## 📖 Descripción

Backend API REST de **San Diego Distribuidora**, sistema de gestión para distribuidoras farmacéuticas. Proporciona endpoints para administrar productos, lotes, inventario, pedidos, facturación, compras, clientes, proveedores, reportes analíticos y alertas automáticas de vencimiento.

Características principales:
- **22 módulos** de funcionalidad con arquitectura en capas (Controller → Service → Model)
- **Autenticación JWT** con blacklist de tokens revocados
- **Control de acceso** basado en roles (4 roles definidos)
- **Tareas automáticas** con APScheduler (alertas de vencimiento + backup de BD)
- **Reportes exportables** a PDF y Excel
- **Documentación OpenAPI 3.0** embebida (Swagger UI)
- **Manejo de errores global** con respuestas JSON siempre

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| Framework Web | Flask 3.x | API REST |
| Base de Datos | MySQL / MariaDB 10.4+ | Persistencia |
| Conector BD | flask-mysqldb | Conexión MySQL |
| Autenticación | PyJWT + bcrypt | Tokens JWT + hash de contraseñas |
| Scheduler | APScheduler | Tareas automáticas |
| Reportes PDF | ReportLab | Generación de PDFs |
| Reportes Excel | OpenPyXL | Generación de XLSX |
| Servidor WSGI | Gunicorn | Producción |
| Variables de Entorno | python-dotenv | Configuración |

---

## ⚙️ Requisitos

- **Python** 3.10 o superior
- **MySQL** 10.4+ / MariaDB (o XAMPP con MySQL)
- **pip** (gestor de paquetes Python)
- **mysqldump** (opcional, para backups automáticos)

---

## 🔧 Instalación

### 1. Base de Datos

```bash
# Crear la base de datos e importar schema + datos de prueba
mysql -u root -p < BD_Distribuidora_SANDIEGO.sql
```

O importa el archivo `BD_Distribuidora_SANDIEGO.sql` desde phpMyAdmin, MySQL Workbench, o tu gestor preferido.

### 2. Entorno Python

```bash
# Clonar el repositorio (si no lo has hecho)
git clone https://github.com/zzskrillexzz/api_formativo_cesar.git
cd api_formativo_cesar/Backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
# .\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Iniciar el Servidor

```bash
python app.py
```

El servidor se iniciará en `http://localhost:5000`. Si el puerto está ocupado, asignará uno libre automáticamente.

### Verificar que funciona

```bash
curl http://localhost:5000/
# → {"mensaje": "API San Diego Distribuidora - Sistema de Pedidos", "estado": "online"}
```

---

## ⚙️ Configuración

### Archivo `.env`

```env
# ── Flask ──
FLASK_ENV=development          # "production" en producción

# ── Base de Datos MySQL ──
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
MYSQL_DB=BD_Distribuidora_SANDIEGO

# ── Seguridad ──
SECRET_KEY=clave_segura_aqui   # Generar con: python -c "import secrets; print(secrets.token_urlsafe(64))"

# ── CORS ──
CORS_ORIGINS=http://localhost:5173   # Múltiples orígenes separados por coma

# ── Backup ──
MYSQLDUMP_PATH=mysqldump        # Ruta completa si mysqldump no está en PATH

# ── Puerto ──
PORT=5000
```

---

## 📁 Estructura del Proyecto

```
Backend/
├── app.py                          # 🚀 Punto de entrada + config Flask
├── config.py                       # Config desde variables de entorno
├── wsgi.py                         # Entry point para Gunicorn
├── scheduler.py                    # Tareas automáticas (APScheduler)
├── swagger.json                    # Especificación OpenAPI 3.0
├── requirements.txt                # Dependencias Python
├── BD_Distribuidora_SANDIEGO.sql   # Schema + seed data
├── .env.example                    # Plantilla de entorno
├── .gitignore
│
├── routers/                        # 🧭 Blueprints (rutas HTTP)
│   ├── __init__.py                 # Registro de todos los blueprints
│   ├── auth.py                     # /login, /logout
│   ├── productos.py                # /productos
│   ├── lotes.py                    # /lotes
│   ├── pedidos.py                  # /pedidos (14 endpoints)
│   ├── facturas.py                 # /facturas
│   ├── clientes.py                 # /clientes
│   ├── compras.py                  # /compras
│   ├── proveedores.py              # /proveedores
│   ├── proveedores_productos.py    # /proveedores_productos
│   ├── detalles_pedidos.py         # /detalles_pedidos
│   ├── detalles_compras.py         # /detalles_compras
│   ├── inventarios_movimientos.py  # /inventarios_movimientos
│   ├── devoluciones.py             # /devoluciones
│   ├── reportes.py                 # /reportes (analíticos + exportación)
│   ├── usuarios.py                 # /usuarios
│   ├── roles.py                    # /roles
│   ├── sesiones.py                 # /sesiones
│   ├── alertas_vencimientos.py     # /alertas_vencimientos
│   ├── anulaciones_ventas.py       # /anulaciones_ventas
│   ├── monitorias.py               # /monitorias
│   ├── mas_vendidos.py             # /mas_vendidos
│   ├── documentacion.py            # /documentacion (Swagger UI)
│   └── publico.py                  # Endpoints públicos
│
├── controllers/                    # 🧠 Lógica de negocio (22 archivos)
│   ├── auth_controller.py
│   ├── productos_controllers.py
│   ├── lotes_controllers.py
│   ├── pedidos_controllers.py
│   ├── facturas_controllers.py
│   ├── clientes_controllers.py
│   ├── compras_controllers.py
│   ├── proveedores_controllers.py
│   ├── proveedores_productos_controllers.py
│   ├── detalles_pedidos_controllers.py
│   ├── detalles_compras_controllers.py
│   ├── inventarios_movimientos_controllers.py
│   ├── devoluciones_controllers.py
│   ├── reportes_controllers.py
│   ├── usuarios_controllers.py
│   ├── roles_controllers.py
│   ├── sesiones_controllers.py
│   ├── alertas_vencimientos_controllers.py
│   ├── anulaciones_ventas_controllers.py
│   ├── monitorias_controllers.py
│   ├── mas_vendidos_controllers.py
│   └── ...
│
├── services/                       # 🔧 Capa de acceso a datos (23 archivos)
│   ├── auth_service.py             # JWT, bcrypt, blacklist, decorador token_requerido
│   ├── productos_service.py
│   ├── pedidos_service.py
│   ├── reportes_service.py         # Reportes analíticos (ventas, inventario, por-vencer)
│   ├── notificaciones_service.py   # Notificaciones (email/WhatsApp)
│   └── ...
│
├── models/                         # 📄 Consultas SQL (22 archivos)
│   ├── productos_model.py
│   ├── clientes_model.py
│   └── ...
│
├── utils/                          # 🛠️ Utilidades
│   ├── validators.py               # Validación de campos
│   ├── exportar.py                 # Exportación PDF (reportlab) y Excel (openpyxl)
│   └── id_generator.py             # Generación de IDs secuenciales
│
└── static/
    └── swagger-ui/                 # 📘 Interfaz Swagger UI embebida
```

---

## 🔌 Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/login` | Iniciar sesión | ❌ No requiere token |
| `POST` | `/logout` | Cerrar sesión (revoca token) | ✅ Requiere token |

**POST /login**

```json
// Request
{
  "usu_correo": "admin@sandiego.com",
  "usu_contrasena": "miclave123"
}

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "usu_id": "USU001",
  "usu_nombre": "Admin",
  "usu_rol_id_fk": "ROL001"
}

// Response 401
{
  "error": "Credenciales incorrectas"
}
```

---

### Usuarios y Roles

#### Usuarios (`/usuarios/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/usuarios/` | Listar todos los usuarios |
| `POST` | `/usuarios/` | Registrar nuevo usuario |
| `PUT` | `/usuarios/` | Editar usuario existente |
| `DELETE` | `/usuarios/eliminar/<id>` | Eliminar usuario |
| `GET` | `/usuarios/buscar` | Buscar usuarios |

#### Roles (`/roles/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/roles/` | Listar roles |
| `POST` | `/roles/` | Registrar nuevo rol |
| `PUT` | `/roles/` | Editar rol |
| `DELETE` | `/roles/eliminar/<id>` | Eliminar rol |
| `GET` | `/roles/buscar` | Buscar roles |

#### Sesiones (`/sesiones/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/sesiones/` | Listar sesiones |
| `POST` | `/sesiones/` | Registrar sesión |
| `PUT` | `/sesiones/` | Editar sesión |
| `DELETE` | `/sesiones/eliminar/<id>` | Eliminar sesión |
| `GET` | `/sesiones/buscar` | Buscar sesiones |

---

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/productos/` | Listar todos los productos |
| `POST` | `/productos/` | Registrar nuevo producto |
| `PUT` | `/productos/` | Editar producto |
| `DELETE` | `/productos/<id>` | Eliminar producto |

**POST /productos/**

```json
// Request
{
  "id": "PRO001",
  "nombre": "Ibuprofeno 400mg",
  "categoria": "Analgésicos",
  "descripcion": "Tabletas de ibuprofeno 400mg",
  "precio": 12.50,
  "cantidad_disponible": 500,
  "proveedor_id": "PROV001"
}

// Response 200
{
  "mensaje": "Producto registrado correctamente"
}
```

---

### Lotes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/lotes/` | Listar todos los lotes |
| `POST` | `/lotes/` | Registrar nuevo lote |
| `PUT` | `/lotes/` | Editar lote |
| `DELETE` | `/lotes/<id>` | Eliminar lote |

---

### Inventario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/inventarios_movimientos/` | Listar movimientos de inventario |
| `POST` | `/inventarios_movimientos/` | Registrar movimiento (entrada/salida) |

---

### Pedidos y Ventas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/pedidos/` | Listar todos los pedidos |
| `POST` | `/pedidos/` | Registrar nuevo pedido |
| `GET` | `/pedidos/<id>` | Buscar pedido por ID |
| `PUT` | `/pedidos/<id>` | Editar pedido |
| `DELETE` | `/pedidos/<id>` | Eliminar pedido |
| `PUT` | `/pedidos/<id>/comprobante` | Subir comprobante de pago |
| `PUT` | `/pedidos/<id>/verificar-pago` | Verificar/confirmar pago |
| `PUT` | `/pedidos/<id>/avanzar-estado` | Avanzar al siguiente estado de entrega |
| `POST` | `/pedidos/<id>/enviar-factura` | Enviar factura por correo |
| `POST` | `/pedidos/<id>/notificar` | Notificar al cliente |

#### Detalles de Pedidos (`/detalles_pedidos/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/detalles_pedidos/` | Listar detalles |
| `POST` | `/detalles_pedidos/` | Registrar detalle |
| `PUT` | `/detalles_pedidos/<id>` | Editar detalle |
| `DELETE` | `/detalles_pedidos/<id>` | Eliminar detalle |

---

### Facturación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/facturas/` | Listar facturas |
| `POST` | `/facturas/` | Registrar factura |
| `GET` | `/facturas/<id>` | Buscar factura por ID |
| `PUT` | `/facturas/<id>` | Editar factura |
| `DELETE` | `/facturas/<id>` | Eliminar factura |

---

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/clientes/` | Listar clientes |
| `POST` | `/clientes/` | Registrar cliente |
| `PUT` | `/clientes/` | Editar cliente |
| `DELETE` | `/clientes/eliminar/<id>` | Eliminar cliente |
| `GET` | `/clientes/buscar` | Buscar clientes |
| `GET` | `/clientes/<id>/historial` | Historial de compras del cliente |

---

### Compras

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/compras/` | Listar compras |
| `POST` | `/compras/` | Registrar compra |
| `GET` | `/compras/<id>` | Buscar compra |
| `PUT` | `/compras/<id>` | Editar compra |
| `DELETE` | `/compras/<id>` | Eliminar compra |

#### Detalles de Compras (`/detalles_compras/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/detalles_compras/` | Listar detalles |
| `POST` | `/detalles_compras/` | Registrar detalle |

---

### Proveedores

#### Proveedores (`/proveedores/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/proveedores/` | Listar proveedores |
| `POST` | `/proveedores/` | Registrar proveedor |

#### Productos por Proveedor (`/proveedores_productos/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/proveedores_productos/` | Listar relaciones |
| `POST` | `/proveedores_productos/` | Registrar relación |

---

### Devoluciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/devoluciones/` | Listar devoluciones |
| `POST` | `/devoluciones/` | Registrar devolución |
| `PUT` | `/devoluciones/<id>` | Editar devolución |
| `DELETE` | `/devoluciones/<id>` | Eliminar devolución |

---

### Reportes

#### CRUD de reportes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/reportes/` | Listar reportes guardados |
| `POST` | `/reportes/` | Registrar reporte |
| `PUT` | `/reportes/` | Editar reporte |
| `DELETE` | `/reportes/eliminar/<id>` | Eliminar reporte |
| `GET` | `/reportes/buscar` | Buscar reportes |

#### Reportes analíticos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/reportes/ventas` | Reporte de ventas (filtro por fechas) |
| `GET` | `/reportes/inventario` | Reporte de inventario completo |
| `GET` | `/reportes/por-vencer` | Productos/lotes por vencer (días configurables) |

**Parámetros de consulta:**

| Endpoint | Parámetros | Ejemplo |
|----------|-----------|---------|
| `/reportes/ventas` | `fecha_desde`, `fecha_hasta` | `?fecha_desde=2026-01-01&fecha_hasta=2026-12-31` |
| `/reportes/por-vencer` | `dias` (default: 30) | `?dias=60` |

#### Exportación de reportes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/reportes/<tipo>/exportar` | Exportar a PDF o Excel |

**Parámetros:**

| Parámetro | Valores | Descripción |
|-----------|---------|-------------|
| `formato` | `pdf`, `xlsx` | Formato de exportación |
| `fecha_desde` | `YYYY-MM-DD` | Fecha inicio (solo ventas) |
| `fecha_hasta` | `YYYY-MM-DD` | Fecha fin (solo ventas) |
| `dias` | número | Días para vencimiento (solo por-vencer) |

**Ejemplos:**

```bash
# Exportar reporte de ventas a PDF
GET /reportes/ventas/exportar?formato=pdf&fecha_desde=2026-01-01&fecha_hasta=2026-12-31

# Exportar inventario a Excel
GET /reportes/inventario/exportar?formato=xlsx

# Exportar productos por vencer a PDF (60 días)
GET /reportes/por-vencer/exportar?formato=pdf&dias=60
```

#### Productos más vendidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/mas_vendidos/` | Top productos más vendidos |

---

### Alertas y Automatización

#### Alertas de Vencimiento (`/alertas_vencimientos/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/alertas_vencimientos/` | Listar alertas generadas |
| `POST` | `/alertas_vencimientos/` | Generar nueva alerta |

#### Anulaciones de Ventas (`/anulaciones_ventas/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/anulaciones_ventas/` | Listar anulaciones |
| `POST` | `/anulaciones_ventas/` | Registrar anulación |
| `PUT` | `/anulaciones_ventas/<id>` | Editar anulación |
| `DELETE` | `/anulaciones_ventas/<id>` | Eliminar anulación |

#### Backup de Base de Datos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/respaldar` | Descargar backup .sql de la BD |

---

### Monitoría

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/monitorias/` | Listar registros de monitoría |
| `POST` | `/monitorias/` | Registrar monitoría |
| `PUT` | `/monitorias/<id>` | Editar registro |
| `DELETE` | `/monitorias/<id>` | Eliminar registro |
| `GET` | `/monitorias/buscar` | Buscar monitorías |

---

### Endpoints Públicos

Estos endpoints **no requieren autenticación**.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Estado de la API |
| `GET` | `/verificar/<pedido_id>` | Consultar estado público de un pedido |
| `GET, POST` | `/confirmar-entrega/<token>` | Confirmar recepción de pedido mediante token |

**GET / — Health Check**

```json
{
  "mensaje": "API San Diego Distribuidora - Sistema de Pedidos",
  "estado": "online"
}
```

**GET /verificar/PED001**

```json
{
  "ped_id": "PED001",
  "ped_estado_entrega": "En proceso",
  "ped_estado_pago": "Pendiente",
  "ped_token_entrega": "abc123token"
}
```

---

## 🗄️ Modelo de Base de Datos

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `t_producto` | Catálogo de productos farmacéuticos |
| `t_lote` | Lotes con fechas de fabricación y vencimiento |
| `t_inventario_movimiento` | Movimientos de entrada y salida de inventario |
| `t_pedido` | Pedidos de clientes |
| `t_detalle_pedido` | Detalle de productos por pedido |
| `t_factura` | Facturación de pedidos |
| `t_cliente` | Clientes registrados |
| `t_proveedor` | Proveedores |
| `t_proveedor_producto` | Relación proveedor-producto |
| `t_compra` | Compras a proveedores |
| `t_detalle_compra` | Detalle de productos por compra |
| `t_usuario` | Usuarios del sistema |
| `t_rol` | Roles y permisos |
| `t_sesion` | Control de sesiones |
| `t_alerta_vencimiento` | Alertas generadas automáticamente |
| `t_anulacion_venta` | Anulaciones de ventas |
| `t_devolucion` | Devoluciones de productos |
| `t_monitoria` | Registro de actividad del sistema |
| `t_token_revocado` | Blacklist de tokens JWT revocados |
| `t_mas_vendido` | Estadísticas de productos más vendidos |
| `t_reporte` | Reportes guardados |
| `t_notificacion` | Notificaciones enviadas |

---

## 🔐 Autenticación JWT

### Flujo de autenticación

```
                 ┌──────────┐
                 │  Cliente │
                 └────┬─────┘
                      │
              POST /login
              { correo, password }
                      │
                      ▼
              ┌───────────────┐
              │ auth_service  │
              │               │
              │ 1. Buscar     │
              │    usuario    │
              │ 2. Verificar  │
              │    bcrypt     │
              │ 3. Verificar  │
              │    estado=1   │
              │ 4. Generar    │
              │    JWT (8h)   │
              └───────┬───────┘
                      │
            ◀─────────┘
      { access_token, usu_nombre, usu_rol_id_fk }
                      │
              ┌───────┴───────┐
              │  Almacenar   │
              │  sessionStorage│
              └───────┬───────┘
                      │
          Cada request → Authorization: Bearer <token>
                      │
                      ▼
              ┌───────────────┐
              │ @token_requerido (decorador)  │
              │               │
              │ 1. Valida header             │
              │ 2. Valida formato Bearer     │
              │ 3. Decodifica JWT (firma)    │
              │ 4. Verifica expiración       │
              │ 5. Valida payload (sub,id,rol)│
              │ 6. Usuario existe y activo   │
              │ 7. Token no revocado         │
              └───────┬───────┘
                      │
                ✅ Acceso concedido
```

### Payload del JWT

```json
{
  "sub": "admin@sandiego.com",     // Correo del usuario
  "id": "USU001",                  // ID del usuario
  "rol": "ROL001",                 // Rol del usuario
  "exp": 1700000000                // Timestamp de expiración (8h)
}
```

### Blacklist de tokens

Al cerrar sesión, el token se agrega a `t_token_revocado` con un hash SHA-256. Cualquier request posterior con ese token recibe `401 Token revocado`.

---

## 🤖 Tareas Automáticas (Scheduler)

El sistema incluye un scheduler basado en APScheduler que ejecuta tareas automáticas.

### Tareas incluidas

| Tarea | Frecuencia | Descripción |
|-------|-----------|-------------|
| 🔍 **Revisar vencimientos** | Diaria (00:00) | Escanea productos y lotes próximos a vencer (30 días) y genera alertas en `t_alerta_vencimiento` |
| 🚫 **Bloquear vencidos** | Diaria | Marca como inactivos productos cuya fecha de caducidad ya pasó |
| 💾 **Backup automático** | Diaria | Genera un archivo .sql de la BD y conserva los últimos 7 backups |

### Configuración

Las tareas se inician automáticamente al arrancar `app.py`:

```python
# scheduler.py
DIAS_ALERTA = 30       # Días antes del vencimiento para generar alerta
BACKUP_DIR = 'backups/' # Directorio de backups
MAX_BACKUPS = 7         # Número máximo de backups a conservar
```

---

## 👥 Roles y Permisos

| Rol | ID | Módulos accesibles |
|-----|-----|-------------------|
| 👑 **Administrador** | ROL001 | Dashboard, Inventario, Ventas, Compras, Reportes, Devoluciones |
| 💼 **Vendedor** | ROL002 | Dashboard, Ventas, Devoluciones |
| 📦 **Bodeguero** | ROL003 | Dashboard, Inventario, Compras, Devoluciones |
| 📈 **Gerente** | ROL004 | Dashboard, Reportes |

El control de acceso se implementa en el frontend: los items del menú se renderizan condicionalmente según el rol del usuario.

---

## ⚠️ Manejo de Errores

Todos los errores devuelven JSON con la misma estructura:

```json
// Error 400 — Datos inválidos
{
  "mensaje": "Faltan los siguientes campos: ['nombre', 'precio']"
}

// Error 401 — Autenticación
{
  "error": "Token expirado",
  "detalle": "El token ha expirado, inicie sesión nuevamente"
}

// Error 404 — No encontrado
// (mensaje específico del módulo)

// Error 500 — Error interno
{
  "error": "Error interno del servidor",
  "detalle": "mensaje del error específico"
}
```

### Códigos de estado HTTP utilizados

| Código | Significado |
|--------|-------------|
| `200` | Éxito |
| `400` | Error de validación (datos faltantes o inválidos) |
| `401` | No autenticado (token faltante, inválido o expirado) |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## 🌐 Despliegue

### Desarrollo

```bash
python app.py
# → http://localhost:5000
```

### Producción con Gunicorn

```bash
# Instalar gunicorn
pip install gunicorn

# Iniciar con 4 workers
gunicorn wsgi:app -w 4 -b 0.0.0.0:8000

# Con logs
gunicorn wsgi:app -w 4 -b 0.0.0.0:8000 --access-logfile - --error-logfile -
```

### Variables para producción

```bash
export FLASK_ENV=production
export CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
export SECRET_KEY=<clave_segura_generada_aleatoriamente>
export MYSQLDUMP_PATH=/usr/bin/mysqldump
```

### Systemd (Linux)

```ini
[Unit]
Description=San Diego API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/api_formativo_cesar/Backend
ExecStart=/opt/api_formativo_cesar/Backend/venv/bin/gunicorn wsgi:app -w 4 -b 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 📘 Documentación Interactiva

La API incluye Swagger UI embebido con la especificación OpenAPI 3.0.

```
http://localhost:5000/documentacion/
```

También puedes acceder al archivo JSON de la especificación:

```
http://localhost:5000/swagger.json
```

---

## 🔐 Variables de Entorno

| Variable | Requerido | Default | Descripción |
|----------|-----------|---------|-------------|
| `FLASK_ENV` | No | `production` | Modo desarrollo/producción |
| `MYSQL_HOST` | Sí | — | Host de MySQL |
| `MYSQL_PORT` | No | `3307` | Puerto de MySQL |
| `MYSQL_USER` | Sí | — | Usuario MySQL |
| `MYSQL_PASSWORD` | Sí | — | Contraseña MySQL |
| `MYSQL_DB` | Sí | — | Nombre de la base de datos |
| `SECRET_KEY` | Sí | — | Clave para firmar JWT |
| `CORS_ORIGINS` | No | `*` | Orígenes permitidos CORS |
| `MYSQLDUMP_PATH` | No | `mysqldump` | Ruta al ejecutable mysqldump |
| `PORT` | No | `5000` | Puerto del servidor |

---

<p align="center">
  <strong>San Diego Distribuidora — Backend API</strong>
  <br />
  <a href="../README.md">← Volver al README principal</a>
  <br />
  <a href="https://github.com/zzskrillexzz/api_formativo_cesar">GitHub</a>
</p>
