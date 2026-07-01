import api from '../axios';

export const detallesComprasService = {
  listar: async (params = {}) => {
    const res = await api.get('/detalles_compras/', { params });
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/detalles_compras/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/detalles_compras/${id}`, data);
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/detalles_compras/${id}`);
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
