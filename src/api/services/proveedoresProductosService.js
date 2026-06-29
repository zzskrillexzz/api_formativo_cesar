import api from '../axios';

export const proveedoresProductosService = {
  listar: async () => {
    const res = await api.get('/proveedores_productos/');
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/proveedores_productos/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  buscarPorProveedor: async (provId) => {
    const res = await api.get(`/proveedores_productos/buscar-por-proveedor/${provId}`);
    return res.data;
  },
  buscarPorProveedorConDatos: async (provId, params = {}) => {
    const res = await api.get(`/proveedores_productos/buscar-por-proveedor-con-datos/${provId}`, { params });
    return res.data;
  }
};
