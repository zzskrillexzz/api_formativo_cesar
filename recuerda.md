# San Diego Distribuidora — Estado Actual del Proyecto

## Arquitectura General

Sistema full-stack para gestión de distribuidora farmacéutica, compuesto por 3 aplicaciones:

- **Backend/** — Flask + MySQL (rama `test`)
- **Frontend/** — React 19 + Vite 7 + Tailwind 4 + Tauri 2 (rama `front`)
- **AppMovil/** — Flutter/Dart (rama `appmovil`)

El repo es `api_formativo_cesar` en GitHub (`zzskrillexzz`). Cada subproyecto tiene su propio `.git`.

## Ramas

| Subproyecto | Rama | Carpeta |
|-------------|------|---------|
| Backend | `test` | `Backend/` |
| Frontend | `front` | `Frontend/` |
| Móvil | `appmovil` | `AppMovil/` |

## Estructura Backend (Flask)

- **Patrón:** Controller → Service → Model (3 capas + router Blueprint)
- **22 módulos:** auth, productos, lotes, pedidos, detalles_pedidos, facturas, clientes, compras, detalles_compras, proveedores, proveedores_productos, inventarios_movimientos, devoluciones, anulaciones_ventas, alertas_vencimientos, reportes, mas_vendidos, usuarios, roles, sesiones, monitorias, publico
- **Auth:** JWT HS256 (8h) + refresh token (7d) + bcrypt + blacklist. Decoradores: `@token_requerido`, `@rol_requerido`, `@rate_limit`
- **Utils clave:** `SearchBuilder`, `id_generator.py`, `validators.py`, `responses.py`, `error_handler.py`
- **Entry point:** `app.py` — Flask + CORS manual + sirve frontend build desde `../Frontend/dist`
- **Docker:** `docker-compose.yml` (MySQL 8.0 + app). BD: `db_drogueria_sandiego`, puerto `3307`, usuario `root` sin password

## Estructura Frontend (React)

- **Entry:** `main.jsx` → `App.jsx` (router por pestañas, sin react-router)
- **State:** `AuthContext.jsx` — login/logout, sessionStorage
- **HTTP:** `api/axios.js` — interceptores JWT + 401 → recarga
- **Pages (lazy-loaded):** Login, Dashboard, Ventas, Inventario, Compras, Reportes, Devoluciones, Usuarios
- **Componentes:** Sidebar, Modal, ConfirmModal, Toast, Notificaciones, ThemeLoader, MetricCard, AnimatedCounter

## Roles y Acceso

- **Roles válidos:** Administrador, Vendedor, Bodeguero, Contador (Gerente ELIMINADO)
- **Sidebar:** Admin ve todo. Vendedor y Bodeguero ven: Dashboard, Inventario, Ventas, Compras, Reportes, Devoluciones. Usuarios solo Admin.
- **Backend:** Vendedor y Bodeguero agregados a rutas de escritura no-críticas. DELETE, verificar-pago y gestión de usuarios siguen solo Admin.
- **Usuario USU005 (Luisa Mora):** reasignado de Gerente → Bodeguero (ROL003)

## Base de Datos

22 tablas en `BD_Distribuidora_SANDIEGO.sql`. Estados de lote: Activo, Agotado, Vencido, Cuarentena.
MySQL en `localhost:3307`, BD `db_drogueria_sandiego`, user `root`, sin password.

## Correcciones Realizadas (histórico)

### 1. Normalización de correos a minúsculas
- Frontend `Usuarios.jsx`: `usu_correo` → `.trim().toLowerCase()`
- Backend `usuarios_controllers.py`: normaliza a minúsculas en crear/editar
- Backend `auth_service.py`: `LOWER(usu_correo) = %s` para login case-insensitive

### 2. Display de método de pago
- Frontend `Ventas.jsx`: lógica ternaria reordenada — `ped_metodo_pago` primero, luego `ped_cuenta_bancaria`

### 3. PED003, PED004, PED050 eliminados
- BD viva + dump SQL — eliminación en cascada de facturas, anulaciones, detalles, devoluciones

### 4. Race condition en nuevos pedidos
- Botón "Nuevo Pedido" deshabilitado mientras `loading=true`
- Endpoint `GET /pedidos/next-id` en backend
- `openModal()` consulta el endpoint con fallback local

### 5. Reportes PDF/Excel — imports faltantes
- `reportes_service.py`: `from reportlab.lib import colors`
- `reportes_service.py`: `Font` en import de `openpyxl.styles`

### 6. Rol Gerente eliminado
- Sidebar, SQL seed, BD viva sin referencias a Gerente

### 7. Paginación en pestaña Pedidos (Ventas.jsx)
- El footer de la pestaña Pedidos solo mostraba contador sin botones Anterior/Siguiente
- Se agregaron controles completos de paginación (mismo patrón que Facturas y Clientes)

### 8. Animaciones del Dashboard en refrescos automáticos
- El `setInterval(fetchData, 30000)` en Dashboard y Reportes causaba re-animación de gráficos recharts
- Se agregó estado `animateCharts`: `true` solo en 1ª carga, luego `false` tras 900ms
- Dashboard: `animateCharts` aplicado a BarChart, PieChart, AreaChart
- Reportes: mismo patrón + `isFirstLoad` ref para evitar flash del ThemeLoader

### 9. Flash de recarga en Reportes (módulo analítica)
- `fetchData` llamaba `setLoading(true)` en cada auto-refresh (30s), mostrando el ThemeLoader
- Se agregó `isFirstLoad` ref: solo muestra loader en carga inicial
- Botón refresh manual: se agregó `manualRefresh` ref para distinguir click manual de auto-refresh

### 10. Botones de refresh rotos (Reportes + Inventario)
- **Reportes:** Nuestro fix #8 hizo que el refresh manual quedara sin feedback visual. Se agregó `manualRefresh` ref para restaurar el ThemeLoader solo en clicks manuales.
- **Inventario (movimientos):** El botón refresh en pestaña movimientos ignoraba filtros. Se corrigió para pasar params actuales (`pagina`, `filtroProducto`, `filtroTipo`, etc.).

### 11. Validación de campos en formulario Proveedor (Compras.jsx)
- **Contacto:** solo acepta números, `+`, `-`, espacios → regex `/[^0-9+\- ]/g`
- **Nombre:** solo acepta letras (incluyendo acentos, ñ, ü) y espacios → regex `/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]/g`
- Aplica tanto en `handleChange` (nuevo) como `handleEditProveedorChange` (edición)

### 12. Preview de comprobante en Verificar pago (Ventas.jsx)
- `<embed>` reemplazado por `<iframe>` para PDFs (más compatible)
- `onError` en `<img>`: si la imagen falla, muestra fallback con mensaje y enlace de descarga
- Extensión correcta en el nombre de descarga (`comprobante.png` / `.pdf` / `.jpg`)

### 13. Comprobante corrupto en descarga — Backend (pedidos_controllers.py)
- **Causa:** Columna `ped_comprobante` es BLOB en MySQL. Al guardar un filename, MySQL devuelve `bytes`. El código no detectaba bytes como filename y los trataba como binario/base64, enviando basura al frontend.
- **Corrección:** Se agregó detección de bytes que decodifican como ASCII limpio (filename: letras, números, `_-{}`). Si es filename → `send_file` desde disco. Si es base64 legacy → `b64decode`. Si es binario puro → se envía directo.

### 14. Rechazar pago limpia comprobante y permite re-subir
- **Backend `verificarPago`:** Al rechazar, elimina archivo del disco y pone `ped_comprobante = NULL`, `ped_comprobante_tipo = NULL`
- **Frontend `confirmarVerificarPago`:** Al rechazar, limpia `ped_tiene_comprobante` en estado local
- **Frontend botones:** Si `ped_estado_pago === 'Rechazado'` → muestra "Subir comprobante" en vez de "Verificar pago"

### 15. Color de barra de stock en Inventario — piso visual de 10 unidades
- **Problema:** La barra de stock usaba `stock_minimo` como única referencia. Con mínimo=1 y stock=3, el ratio era 3.0 → barra verde al 100%. Además el rango `ratio >= 1` devolvía `bg-blue-400` (azul), no alerta.
- **Corrección `getStockBarColor`:** Se cambió la escala de colores: `>= 2` verde, `>= 1.5` azul, `>= 1` ámbar, `< 1` rojo.
- **Piso visual:** Tanto color como ancho ahora usan `Math.max(stock_minimo, 10)` para que productos con mínimo muy bajo no se vean siempre verdes/llenos.
- **Archivos:** `Frontend/src/pages/Inventario.jsx`

### 16. Validación de ID de cliente — cédulas colombianas de 10 dígitos
- **Problema:** El campo `cli_id` tenía `max="9999999"` (7 dígitos), insuficiente para cédulas colombianas de 10 dígitos como 1044601781.
- **Corrección:** Se eliminó la validación `max=9999999` y se agregó límite de 11 dígitos (`max="99999999999"`) suficiente para CC (7-10 díg) y NIT.
- **Archivos:** `Frontend/src/pages/Ventas.jsx`, `Backend/controllers/clientes_controllers.py`

### 17. Ruta de comprobantes configurable (app de escritorio Tauri)
- **Problema:** La ruta de comprobantes estaba hardcodeada como `current_app.root_path + '/comprobantes'`.
- **Corrección:** Se creó `COMPROBANTES_DIR` en la config de Flask (`app.py`), la carpeta se crea automáticamente al arrancar. Se puede cambiar editando `app.py` o con variable de entorno.
- **Archivos:** `Backend/app.py`, `Backend/services/pedidos_service.py`, `Backend/controllers/pedidos_controllers.py`

### 18. Refetch de datos al cambiar de tab en Reportes (anulaciones)
- **Problema:** El gráfico de anulaciones y el resumen no se actualizaban en tiempo real. Solo había un `setInterval` de 30s.
- **Corrección:** Se redujo el intervalo de 30s a 15s. Se agregó un `useEffect` que refetchea los datos cada vez que el usuario cambia de tab.
- **Archivo:** `Frontend/src/pages/Reportes.jsx`

### 19. Eliminación de usuarios — sesiones ya no bloquean
- **Problema:** `eliminarUsuarios` no verificaba `t_sesion`. Al loguearse se crea un registro en sesiones con FK al usuario, y el DELETE de MySQL fallaba con error 1451 aunque el usuario estuviera limpio.
- **Corrección:** Se agregó `DELETE FROM t_sesion WHERE ses_usu_id_fk = %s` antes de eliminar el usuario, limpiando las sesiones automáticamente.
- **Archivo:** `Backend/services/usuarios_service.py`

### 20. Validación de contraseña — mínimo 6 caracteres
- **Problema:** No había validación de longitud mínima para la contraseña al crear o editar usuarios.
- **Corrección:** Se agregó validación de mínimo 6 caracteres tanto en frontend (`Usuarios.jsx`) como en backend (`usuarios_controllers.py`).
- **Archivos:** `Frontend/src/pages/Usuarios.jsx`, `Backend/controllers/usuarios_controllers.py`

### 21. Confirmación con contraseña de administrador al editar usuarios
- **Problema:** Al editar un usuario no se requería ninguna autorización especial.
- **Corrección:** Se agregó un campo "Contraseña de administrador" en el modal de edición. El backend busca TODOS los usuarios con rol Administrador y verifica la contraseña contra cada uno usando bcrypt. Si ninguna coincide, rechaza la operación.
- **Archivos:** `Frontend/src/pages/Usuarios.jsx`, `Backend/controllers/usuarios_controllers.py`

### 22. Roles cargados desde BD (no hardcodeados)
- **Problema:** `ROLES_DISPONIBLES = ['Administrador', 'Vendedor', 'Bodeguero', 'Contador']` estaba hardcodeado en el frontend, y "Contador" no existía en la BD. Además el backend validaba contra la misma lista hardcodeada.
- **Corrección:** Frontend deriva `rolesDisponibles` del estado `roles` (cargado vía `GET /roles/`). Backend consulta `t_rol` para validar roles en crear/editar.
- **Archivos:** `Frontend/src/pages/Usuarios.jsx`, `Backend/controllers/usuarios_controllers.py`

### 23. Eliminación de usuarios — verificaciones completas de FK
- **Problema:** `eliminarUsuarios` no verificaba varias tablas con FK a `t_usuario` (`t_inventario_movimiento`, `t_reporte`, `t_alerta_vencimiento`, `t_anulacion_venta`, `t_usuario_factura`). Además verificaba `t_monitoria` con columna `mon_usu_id_fk` inexistente.
- **Corrección:** Se agregaron todas las verificaciones faltantes. Se eliminó el check roto de `mon_usu_id_fk`. Se agregó limpieza de `t_token_revocado`.
- **Archivo:** `Backend/services/usuarios_service.py`

### 24. Validación con nombres legibles — "contraseña" en vez de "usu_contrasena"
- **Problema:** Las validaciones de campos vacíos mostraban el nombre interno del campo (`usu_contrasena`, `usu_nombre`, etc.) en vez de nombres legibles.
- **Corrección:** Se usa el diccionario `LIMITES` de `validators.py` para mostrar nombres descriptivos.
- **Archivo:** `Backend/controllers/usuarios_controllers.py`

### 25. Estado "Inactivo" bloqueado al crear usuario
- **Problema:** En el formulario de nuevo usuario se podía seleccionar estado "Inactivo", creando usuarios desactivados desde el inicio.
- **Corrección:** El selector de Estado solo se muestra al editar. Los nuevos usuarios siempre se crean como Activo.
- **Archivo:** `Frontend/src/pages/Usuarios.jsx`

### 26. Confirmar contraseña al crear/editar usuarios
- **Problema:** No había un campo "Confirmar contraseña". El usuario podía escribir mal la contraseña sin detectarlo.
- **Corrección:** Se agregó campo "Confirmar contraseña" con validación en vivo (✓/⚠) y validación al enviar. Aparece al crear usuario y también al editar cuando se escribe una nueva contraseña.
- **Archivo:** `Frontend/src/pages/Usuarios.jsx`

### 27. 3 intentos para contraseña de administrador al editar
- **Problema:** Al editar un usuario, si la contraseña de administrador era incorrecta, fallaba inmediatamente sin dar oportunidad de reintentar.
- **Corrección:** Se agregó contador de 3 intentos con feedback visual ("Intentos restantes: N"). Tras 3 fallos el input se deshabilita y pide cerrar/reabrir el modal.
- **Archivo:** `Frontend/src/pages/Usuarios.jsx`

### 28. Botón Guardar deshabilitado cuando no hay cambios en edición
- **Problema:** El botón Guardar siempre estaba habilitado aunque no se hubieran modificado campos, mostrando solo un toast de advertencia.
- **Corrección:** Se agregó `hasChanges` que compara nombre, correo, rol, estado y nueva contraseña contra el snapshot original. El botón se deshabilita si no hay cambios.
- **Archivo:** `Frontend/src/pages/Usuarios.jsx`

### 29. Dashboard — overflow-hidden removido de contenedores
- **Problema:** Los contenedores del Dashboard tenían `overflow-hidden` que recortaba sombras (`hover:shadow-md`) y contenido de tablas/gráficos.
- **Corrección:** Se eliminó `overflow-hidden` de los 5 contenedores principales del Dashboard.
- **Archivo:** `Frontend/src/pages/Dashboard.jsx`

### 30. Login — rate limit eliminado
- **Problema:** `@rate_limit(max_requests=10, window_seconds=60)` en el login contaba TODAS las solicitudes (exitosas y fallidas). Detrás de un proxy, `request.remote_addr` es la IP del proxy, haciendo que el límite sea GLOBAL para todos los usuarios. Una sola contraseña incorrecta + solicitudes de otros usuarios bloqueaba el sistema completo por 60s.
- **Corrección:** Se eliminó `@rate_limit` del endpoint `/login`.
- **Archivo:** `Backend/routers/auth.py`

### 31. Frontend — ReferenceError: Cannot access 'editingUserId' before initialization (TDZ)
- **Problema:** `hasChanges` estaba definida ANTES de que `editingUserId`, `formData` y `formSnapshotRef` fueran declarados con `useState`/`useRef`. JavaScript lanza ReferenceError por Temporal Dead Zone al intentar acceder a `editingUserId` antes de su inicialización.
- **Corrección:** Se movió `hasChanges` después de todas las declaraciones de estado/ref que necesita (editingUserId, formData, formSnapshotRef).
- **Archivo:** `Frontend/src/pages/Usuarios.jsx`

## Reglas de trabajo

- **Siempre hacer push después de cada cambio** en la rama que corresponda:
  - `Frontend/` → `git -C Frontend ... push origin front`
  - `Backend/` → `git -C Backend ... push origin test`
- Usar commits descriptivos en español con prefijos `fix:`, `feat:`, `refactor:`

## Bugs Pendientes

1. **Validación cuarentena en ventas:** El frontend (`Ventas.jsx:224`) filtra productos por `estado === 'Activo'` pero no verifica estado de lotes. El backend tiene validación parcial en controller (`pedidos_controllers.py:137-159`) que solo bloquea si TODOS los lotes son cuarentena.
2. **Stock inflado en frontend:** `Ventas.jsx:320` usa `cantidad_disponible` del producto (incluye lotes cuarentena). Debería calcular stock solo de lotes `Activo`.
