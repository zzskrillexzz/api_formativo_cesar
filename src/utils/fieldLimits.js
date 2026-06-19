/**
 * Límites máximos de caracteres por campo del backend.
 * Refleja exactamente el diccionario LIMITES en Backend/utils/validators.py
 * para mantener coherencia frontend-backend.
 */

export const FIELD_LIMITS = {
  // Clientes
  cli_tipo_documento: 20,
  cli_nombre: 80,
  cli_apellido: 80,
  cli_correo: 120,
  cli_telefono: 10,
  cli_direccion: 200,
  // Productos
  nombre: 100,
  categoria: 50,
  descripcion: 500,
  // Proveedores
  nit: 30,
  contacto: 20,
  email: 120,
  direccion: 200,
  tipo: 30,
  // Usuarios
  usu_nombre: 80,
  usu_correo: 120,
  usu_contrasena: 255,
  usu_rol: 20,
  // Pedidos
  ped_cuenta_bancaria: 50,
  ped_comprobante_tipo: 20,
  // Compras
  com_observacion: 500,
  com_comprobante_tipo: 20,
  // Anulaciones
  anu_motivo: 500,
  // Inventario
  inm_motivo: 300,
  // Devoluciones
  motivo: 500,
  // Facturas
  forma_pago: 50,
  cuenta_bancaria: 50,
  // Lotes
  lot_numero: 50,
  // Reportes
  rep_tipo: 50,
  rep_parametros: 2000,
  rep_resultado: 5000,
  // Roles
  nombre: 50,
  // Sesiones
  ses_ip: 45,
};

/**
 * Hook que devuelve un onChange que limita la longitud según FIELD_LIMITS.
 *
 * Uso en el componente:
 *   const { handleLimitedChange } = useFieldLimits(setFormData, formData);
 *   ...
 *   <input name="cli_nombre" value={...} onChange={handleLimitedChange} />
 */
export function useFieldLimits(setFormData, formData) {
  const handleLimitedChange = (e) => {
    const { name, value } = e.target;
    const max = FIELD_LIMITS[name];
    if (max && value.length > max) {
      // No actualiza el estado — el navegador no deja escribir más
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  return { handleLimitedChange };
}
