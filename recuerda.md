# Contexto Rápido — San Diego Distribuidora

## Push siempre
- **Backend/** → rama `test`, remoto `https://github.com/zzskrillexzz/api_formativo_cesar.git`
- **Frontend/** → rama `front`, mismo remoto
- Usar `git -C Backend ...` y `git -C Frontend ...`

## Estilo UI
- Azul corporativo: `#2563eb` (blue-600). Gradientes: `from-blue-600 to-blue-800`
- Sidebar: `bg-gradient-to-b from-blue-600 to-blue-800`
- Toast propio, centrado arriba, `z-[9999]`

## BD
- Esquema: `Backend/BD_Distribuidora_SANDIEGO.sql`
- MySQL 10.4.32-MariaDB, puerto 3307

## Fixes aplicados — sesión 2026-06-23
1. **FK t_rol ↔ t_usuario**: se eliminó FK invertida y se creó `fk_usuario_rol`. BD + SQL + service.
2. **NIT solo números**: sanitización `[^0-9]` en frontend + backend regex.
3. **Barra stock productos**: ancho `disp / (min * 2) * 100`.
4. **NIT sin ceros a izquierda + mínimo 6 dígitos**: validación frontend + backend.

## Fixes aplicados — sesión 2026-06-24
5. **Botón Guardar Cambios bloqueado en editar proveedor**: `setErrors({})` al abrir modal + `validateField()` en `handleEditProveedorChange`. Archivo: `Frontend/src/pages/Compras.jsx`
6. **Factura no se puede crear Anulada + editar factura (PUT)**: Backend fuerza `estado = 'Vigente'` en POST. Frontend: oculta "Anulada" al crear, la muestra solo al editar; se agregó `editingFacturaId` + función `abrirEditarFactura` + botón Edit3 en tabla. Archivos: `Backend/controllers/facturas_controllers.py`, `Frontend/src/pages/Ventas.jsx`
7. **Total compra auto-calculado desde productos**: Se agregó sección de productos (selector, cantidad, precio, subtotal) al formulario de crear y editar compra. El total es readonly y se calcula como suma de subtotales. Al guardar crea compra + detalles. Archivos: `Frontend/src/pages/Compras.jsx`, `Frontend/src/api/services/detallesComprasService.js`
8. **Campos fecha y cliente vacíos al editar factura**: Faltaban `pedido_seleccionado`, `cli_nombre_mostrar` y `cli_correo_mostrar` en `abrirEditarFactura`. Archivo: `Frontend/src/pages/Ventas.jsx`

## Fix aplicado — sesión 2026-06-25
9. **Más Vendidos — Decimal/None sin convertir causa datos erróneos en Dashboard**: `total_unidades_vendidas` desde vista `v_mas_vendidos` llega como `decimal.Decimal` o `None`. Se agregó `int()` forzoso en el constructor del modelo y se añadió `total_ingresos` (float). Archivos: `Backend/models/mas_vendidos_model.py`, `Backend/services/mas_vendidos_service.py`
10. **FK invertida t_rol → t_usuario bloqueaba DELETE usuarios**: Se eliminó `CONSTRAINT t_rol_ibfk_1 (rol_id → usu_rol_id_fk)` y se creó `fk_usuario_rol (usu_rol_id_fk → rol_id)`. Archivo: `Backend/BD_Distribuidora_SANDIEGO.sql`
11. **Validación nombre usuario solo letras**: Frontend filtra números en campo nombre. Backend usa `validar_nombre_apellido()`. Archivos: `Frontend/src/pages/Usuarios.jsx`, `Backend/controllers/usuarios_controllers.py`
12. **dco_lot_id_fk opcional en detalles de compra**: El backend exigía lote como obligatorio pero el frontend no lo envía. Se hizo opcional. Archivo: `Backend/controllers/detalles_compras_controllers.py`
13. **Formulario compras mejoras**: filtro productos por proveedor, precio automático/bloqueado, Estado Cancelada solo en PUT (frontend + backend), observación rows=3, bug PUT (no exigía productos si ya tiene en BD). Archivo: `Frontend/src/pages/Compras.jsx`, `Backend/controllers/compras_controllers.py`
14. **Productos renumerados y datos de prueba**: 27 productos nuevos con stock asignados a sus proveedores. IDs renumerados PRO001-PRO036 secuencial. Productos test eliminados. FK references actualizadas en todas las tablas.
