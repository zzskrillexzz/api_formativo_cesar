import api from '../axios';

export const facturasService = {
  listar: async (params = {}) => {
    const res = await api.get('/facturas/', { params });
    // Siempre extraer el array .data si existe
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/facturas/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  buscar: async (id) => {
    const res = await api.get(`/facturas/${id}`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/facturas/${id}`, data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/facturas/${id}`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
