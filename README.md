#  Documentación del Frontend — San Diego Distribuidora

**Última actualización:** Mayo 2026  
**Versión:** 0.1.1  
**Producto:** `distribuidora` — Sistema de Gestión para Droguería / Distribuidora Farmacéutica

---

##  Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Arquitectura General](#3-arquitectura-general)
4. [Punto de Entrada](#4-punto-de-entrada)
5. [Sistema de Autenticación](#5-sistema-de-autenticación)
6. [Navegación y Layout](#6-navegación-y-layout)
7. [Páginas / Vistas](#7-páginas--vistas)
8. [Componentes](#8-componentes)
9. [Capa de API / Servicios](#9-capa-de-api--servicios)
10. [Estilos](#10-estilos)
11. [Integración Tauri (Escritorio)](#11-integración-tauri-escritorio)
12. [Workflow de Desarrollo](#12-workflow-de-desarrollo)
13. [Diagrama de Flujo](#13-diagrama-de-flujo)
14. [Pendientes y Mejoras](#14-pendientes-y-mejoras)

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework UI** | React | 19.1.0 |
| **Bundler** | Vite | 7.0.4 |
| **Lenguaje** | JavaScript (JSX) | ES Modules |
| **HTTP Client** | Axios | 1.16.0 |
| **CSS Framework** | Tailwind CSS | 4.2.4 |
| **Íconos** | Lucide React | 1.14.0 |
| **Desktop Wrapper** | Tauri | 2.x |
| **Backend** | Flask (Python) | — |

---

## 2. Estructura del Proyecto

```
Frontend/
├── index.html                 # Entry point HTML (Vite)
├── package.json               # Dependencias y scripts
├── package-lock.json          # Lockfile de npm
├── vite.config.js             # Configuración de Vite + Tailwind
├── README.md                  # Plantilla base de Tauri
├── DOCUMENTACION_FRONTEND.md  # ← Este documento
│
├── public/
│   ├── vite.svg               # Favicon Vite
│   └── tauri.svg              # Favicon Tauri
│
├── src/
│   ├── main.jsx               #  Punto de entrada React
│   ├── App.jsx                #  Componente raíz: Layout + Router de pestañas
│   ├── App.css                # Importa Tailwind
│   ├── index.css              # Importa Tailwind
│   │
│   ├── api/
│   │   ├── axios.js           # 🔌 Instancia de Axios configurada
│   │   └── services/
│   │       ├── authService.js # 📡 Servicio de autenticación (login)
│   │       ├── lotesService.js# 📡 Servicio de lotes (vacío)
│   │       └── ventasService.js#📡 Servicio de ventas (vacío)
│   │
│   ├── assets/
│   │   └── react.svg          # Logo React
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── MetricCard.jsx #  Tarjeta de métrica KPI
│   │   │   ├── AlertasTable.jsx #  Tabla de alertas (vacío)
│   │   │   └── PanelAcciones.jsx #  Panel de acciones (vacío)
│   │   └── layout/
│   │       ├── Sidebar.jsx    #  Barra lateral de navegación
│   │       └── Topbar.jsx     #  Barra superior (vacío — el código real está inline en App.jsx)
│   │
│   ├── context/
│   │   └── AuthContext.jsx     #  Contexto global de autenticación
│   │
│   └── pages/
│       ├── Login.jsx          #  Página de inicio de sesión
│       ├── Dashboard.jsx      #  Dashboard principal
│       ├── Inventario.jsx     #  Módulo de inventario (vacío)
│       └── Ventas.jsx         #  Módulo de ventas (vacío)
│
└── src-tauri/                 #  Capa Tauri (Rust) — desktop wrapper
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/
    │   └── default.json
    ├── icons/                 # Íconos de la app desktop
    └── src/
        ├── main.rs
        └── lib.rs
```

---

## 3. Arquitectura General

```
┌──────────────────────────────────────────────────────────────┐
│                        index.html                            │
│                         <div id="root">                      │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                       main.jsx                               │
│            ReactDOM.createRoot → <App />                     │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                        App.jsx                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   AuthProvider                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │                 Layout                        │   │   │
│  │  │                                              │   │   │
│  │  │  ¿isLogged?                                  │   │   │
│  │  │     ├── NO  → <LoginPage />                  │   │   │
│  │  │     └── SÍ  → <Sidebar /> + <Dashboard />    │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Patrón de navegación

La app **NO usa React Router**. Usa un sistema de **pestañas** gestionado con estado local (`activeTab`):

```jsx
const [activeTab, setActiveTab] = useState('Dashboard');
```

Los módulos se renderizan condicionalmente según `activeTab`:

```jsx
{activeTab === 'Dashboard' ? <DashboardPage /> : <Placeholder />}
```

---

## 4. Punto de Entrada

### `index.html`
- HTML mínimo con `<div id="root">`
- Carga `main.jsx` como módulo ES

### `main.jsx` [main.jsx](src/main.jsx:1)
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### `App.jsx` [App.jsx](src/App.jsx:1)
El componente raíz exporta:

```jsx
export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
```

El componente `Layout`:
1. Lee `isLogged`, `role`, `user` desde `useAuth()`
2. Si **NO** está logueado → renderiza `<LoginPage />`
3. Si **SÍ** está logueado → renderiza `<Sidebar />` + contenido principal (Topbar + Dashboard por pestañas)

---

## 5. Sistema de Autenticación

### Flujo de login

```
User Input           AuthContext.login()        authService.login()       Backend Flask
──────────           ───────────────────        ───────────────────       ─────────────
correo + password ──▶ valida inputs         ──▶ POST /login          ──▶ MySQL consulta
                         │                        { usu_correo,           t_usuario
                         │                         usu_contrasena }       └─ verifica credenc.
                         │                        ◀── 200 + userData ────
                         │ setUser({...})         ◀── 401 error
                         │ setRole(...)
                         │ setIsLogged(true)
                         ▼
                    <LoginPage /> desaparece
                    <Dashboard /> se renderiza
```

### `AuthContext.jsx` [AuthContext.jsx](src/context/AuthContext.jsx:1)

Provee el estado global de autenticación:

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `isLogged` | `boolean` | Indica si hay sesión activa |
| `role` | `string \| null` | Rol del usuario (`ROL001`, `ROL002`, etc.) |
| `user` | `object \| null` | Datos del usuario: `{ name, initials }` |
| `loading` | `boolean` | Indica si una operación de auth está en progreso |

**Funciones expuestas:**

| Función | Parámetros | Retorno | Descripción |
|---------|-----------|---------|-------------|
| `login(correo, password)` | `string, string` | `{ success, message? }` | Autentica contra el backend |
| `logout()` | — | `void` | Cierra sesión, limpia estado |

**Mapeo de datos del backend → frontend:**

```js
// Lo que devuelve el backend (auth_service.py)
{ usu_nombre, usu_rol_id_fk }

// Cómo se almacena en AuthContext
setUser({
  name: userData.usu_nombre,
  initials: userData.usu_nombre.substring(0, 2).toUpperCase()
});
setRole(userData.usu_rol_id_fk);  // "ROL001", "ROL002", etc.
```

### `Login.jsx` [Login.jsx](src/pages/Login.jsx:1)

Pantalla **full-screen** con diseño en dos columnas:

| Columna izquierda | Columna derecha |
|-------------------|-----------------|
| Branding: logo, "San Diego Distribuidora" | Formulario de login |
| Fondo azul con textura | Campos: correo, contraseña |
| "Logistics OS v1.0" | Validación local + spinner al enviar |

**Validaciones locales:**
- Ambos campos requeridos
- Error se muestra en banner rojo
- Botón se deshabilita durante `loading`

---

## 6. Navegación y Layout

### `Sidebar.jsx` [Sidebar.jsx](src/components/layout/Sidebar.jsx:1)

Barra lateral fija (272px) con:

1. **Header**: Logo "SAN DIEGO" + subtítulo "Distribuidora"
2. **Menú de navegación**: items filtrados por rol del usuario
3. **Botón de logout**: al fondo, con ícono `LogOut`

**Estructura del menú:**

| ID | Etiqueta | Ícono | Roles con acceso |
|----|----------|-------|-----------------|
| `Dashboard` | Dashboard | `LayoutDashboard` | ROL001, ROL002, ROL003, ROL004 |
| `Inventario` | Inventario | `Package` | ROL001, ROL003 |
| `Ventas` | Módulo Ventas | `ShoppingCart` | ROL001, ROL002 |
| `Compras` | Gestión Compras | `Truck` | ROL001, ROL003 |
| `Reportes` | Analítica | `BarChart3` | ROL001, ROL004 |

**Control de acceso por rol:** cada item solo se renderiza si `item.roles.includes(role)`.

### Topbar (inline en App.jsx)

La barra superior **no está en un componente separado** (Topbar.jsx está vacío). Está inline en `App.jsx` y contiene:

- **Campo de búsqueda** (placeholder visual, sin funcionalidad real)
- **Badge de usuario**: iniciales + nombre + rol
- **Campana de notificaciones** (placeholder con punto rojo)

---

## 7. Páginas / Vistas

### `Login.jsx` — Inicio de Sesión
- **Estado:** ✅ Implementado
- **Ruta visual:** Pantalla completa, no usa layout
- **Conexión backend:** `POST /login`

### `Dashboard.jsx` — Dashboard Principal [Dashboard.jsx](src/pages/Dashboard.jsx:1)
- **Estado:**  Implementado con datos dummy
- **Secciones:**
  1. **Métricas KPI** (4 tarjetas): Ventas Hoy, Stock Total, Vencimientos, Proveedores
  2. **Tabla de Alertas** de lotes próximos a vencer (3 filas dummy)
  3. **Acceso Rápido**: 4 botones de acción (placeholder)
  4. **Estado del Sistema**: badge "Base de datos sincronizada"

### `Inventario.jsx` — Inventario
- **Estado:**  Archivo vacío (placeholder)

### `Ventas.jsx` — Ventas
- **Estado:**  Archivo vacío (placeholder)

---

## 8. Componentes

### `MetricCard.jsx` [MetricCard.jsx](src/components/dashboard/MetricCard.jsx:1)

Tarjeta reutilizable para KPIs.

**Props:**

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Etiqueta de la métrica |
| `value` | `string` | Valor principal (ej: `"$1.2M"`) |
| `icon` | `LucideIcon` | Componente de ícono de Lucide |
| `colorClass` | `{ bg, text }` | Clases Tailwind para color del ícono |
| `trend` | `string?` | Tendencia opcional (ej: `"+5.2%"`) |

### `AlertasTable.jsx`
- **Estado:**  Archivo vacío (placeholder). La tabla de alertas está inline en `Dashboard.jsx`.

### `PanelAcciones.jsx`
- **Estado:**  Archivo vacío (placeholder). Los botones de acceso rápido están inline en `Dashboard.jsx`.

### `Topbar.jsx`
- **Estado:**  Archivo vacío. La topbar está inline en `App.jsx`.

---

## 9. Capa de API / Servicios

### `axios.js` — Instancia de Axios [axios.js](src/api/axios.js:1)

```js
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});
```

- **Base URL:** Apunta directamente al backend Flask en `localhost:5000`
- **Headers por defecto:** `Content-Type: application/json`

### `authService.js` — Servicio de Autenticación [authService.js](src/api/services/authService.js:1)

```js
export const authService = {
  login: async (correo, password) => { ... }
};
```

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| `login(correo, password)` | `POST /login` | `{ usu_correo, usu_contrasena }` | `{ access_token, token_type, usu_nombre, usu_rol_id_fk }` |

### `lotesService.js` y `ventasService.js`
- **Estado:**  Archivos vacíos (placeholders para futuros servicios)

---

## 10. Estilos

### Tailwind CSS 4

- **Framework:** Tailwind CSS v4.2.4
- **Plugin de Vite:** `@tailwindcss/vite`
- **Configuración:** Sin archivo `tailwind.config.js` — Tailwind v4 usa configuración vía CSS

```css
/* index.css y App.css — ambos solo importan Tailwind */
@import "tailwindcss";
```

### Paleta de colores usada

| Color | Uso |
|-------|-----|
| `slate-50`, `slate-100` | Fondos, bordes suaves |
| `slate-800`, `slate-900` | Texto principal, sidebar |
| `blue-600`, `blue-700`, `blue-800` | Acciones, branding, sidebar activo |
| `emerald-400`, `emerald-500` | Estados positivos, "Sincronizado" |
| `orange-500` | Alertas de vencimiento |
| `red-50`, `red-500`, `red-600` | Errores, notificaciones |

### Patrones visuales recurrentes

- **Bordes redondeados grandes:** `rounded-2xl`, `rounded-3xl`, `rounded-[40px]`
- **Sombras suaves:** `shadow-sm`, `shadow-lg`, `shadow-2xl`
- **Tipografía:** `font-black`, `tracking-tighter`, `uppercase`, `italic` — estilo "industrial / logistics"
- **Espaciado consistente:** `px-10` en layout principal, `p-6` en tarjetas

---

## 11. Integración Tauri (Escritorio)

Tauri empaqueta la app web como aplicación de escritorio nativa usando un webview del sistema.

### Configuración principal [tauri.conf.json](src-tauri/tauri.conf.json:1)

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `productName` | `distribuidora` | Nombre del ejecutable |
| `identifier` | `com.distribuidora.app` | Identificador único |
| `build.devUrl` | `http://localhost:5173` | URL del dev server de Vite |
| `build.frontendDist` | `../dist` | Carpeta de build de producción |
| `app.windows[0].title` | `distribuidora` | Título de la ventana |
| `app.security.csp` | `null` | CSP deshabilitado |

### Capa Rust [lib.rs](src-tauri/src/lib.rs:1)

```rust
#[tauri::command]
fn greet(name: &str) -> String { ... }

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- Expone un comando `greet` (ejemplo de plantilla)
- Registra el plugin `opener` para abrir URLs en el navegador del sistema

### Capacidades [default.json](src-tauri/capabilities/default.json:1)

```json
{
  "windows": ["main"],
  "permissions": ["core:default", "opener:default"]
}
```

---

## 12. Workflow de Desarrollo

### Requisitos previos

- **Node.js** ≥ 18
- **npm** (incluido con Node)
- **Rust** (solo para compilar Tauri — no necesario para desarrollo web)

### Comandos

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instalar dependencias |
| `npm run dev` | Iniciar servidor de desarrollo Vite en `http://localhost:5173` |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar build de producción |
| `npm run tauri` | Menú de comandos Tauri |

### Variables de entorno (implícitas)

- **Backend URL:** `http://localhost:5000` — hardcodeado en `axios.js`
- **Frontend port:** `5173` — default de Vite

### Orden de arranque para desarrollo

```bash
# Terminal 1: Backend
cd Backend
python app.py          # Flask en :5000

# Terminal 2: Frontend
cd Frontend
npm run dev            # Vite en :5173
```

---

## 13. Diagrama de Flujo

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────┐
│ Navegador │    │   Vite :5173 │    │  Flask :5000  │    │  MySQL   │
│           │    │              │    │               │    │  :3307   │
└─────┬─────┘    └──────┬───────┘    └───────┬───────┘    └────┬─────┘
      │                 │                    │                 │
      │  Abre app       │                    │                 │
      │────────────────▶│                    │                 │
      │                 │                    │                 │
      │  <Login />      │                    │                 │
      │  ingresa datos  │                    │                 │
      │                 │                    │                 │
      │  POST /login    │                    │                 │
      │─────────────────┼───────────────────▶│                 │
      │                 │                    │  SELECT ...     │
      │                 │                    │────────────────▶│
      │                 │                    │◀────────────────│
      │                 │                    │                 │
      │                 │  userData + token  │                 │
      │◀────────────────┼────────────────────│                 │
      │                 │                    │                 │
      │  <Dashboard />  │                    │                 │
      │  (datos dummy)  │                    │                 │
      │                 │                    │                 │
```

1. El usuario accede a `localhost:5173` (servido por Vite)
2. Se muestra la pantalla de Login
3. Al hacer login, el frontend envía `POST /login` al backend Flask
4. Flask consulta MySQL y devuelve datos del usuario + JWT
5. AuthContext almacena la sesión y se muestra el Dashboard

---

## 14. Pendientes y Mejoras

### Componentes vacíos (placeholders)

| Archivo | Ubicación | Estado |
|---------|-----------|--------|
| `Inventario.jsx` | `pages/` | ❌ Vacío |
| `Ventas.jsx` | `pages/` | ❌ Vacío |
| `Topbar.jsx` | `components/layout/` | ❌ Vacío (código inline en App.jsx) |
| `AlertasTable.jsx` | `components/dashboard/` | ❌ Vacío (código inline en Dashboard) |
| `PanelAcciones.jsx` | `components/dashboard/` | ❌ Vacío (código inline en Dashboard) |
| `lotesService.js` | `api/services/` | ❌ Vacío |
| `ventasService.js` | `api/services/` | ❌ Vacío |

### Mejoras técnicas recomendadas

1. **Extraer lógica inline a componentes**
   - Mover la Topbar de `App.jsx` a `Topbar.jsx`
   - Mover la tabla de alertas de `Dashboard.jsx` a `AlertasTable.jsx`
   - Mover los botones de acción de `Dashboard.jsx` a `PanelAcciones.jsx`

2. **React Router**
   - Reemplazar el sistema de `activeTab` con `react-router-dom` para URLs navegables

3. **Gestión del token JWT**
   - Guardar el token en `localStorage` para persistir sesión
   - Agregar interceptor de Axios para adjuntar `Authorization: Bearer <token>`

4. **Variables de entorno para URLs**
   ```js
   // En lugar de hardcodear:
   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
   ```

5. **Datos reales en Dashboard**
   - Conectar las métricas KPI a endpoints del backend
   - Poblar la tabla de alertas desde el endpoint `/alertas_vencimientos`

6. **Manejo de errores global**
   - Agregar un interceptor de Axios para errores 401 (token expirado → redirect a login)

7. **CORS en producción**
   - Para Tauri en producción, configurar CORS para el origen `tauri://localhost`

---

>  **Nota:** Este documento se generó analizando el código fuente del frontend en `Frontend/src/`. Cualquier cambio en el código debe reflejarse aquí.
