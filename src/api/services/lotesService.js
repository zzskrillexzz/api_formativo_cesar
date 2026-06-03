import api from '../axios';

export const lotesService = {
  listar: async (params = {}) => {
    const res = await api.get('/lotes/', { params });
    // Si se pidió paginación explícita, retornamos el objeto completo
    if (params.page || params.limit) return res.data;
    // Sin params: compatibilidad con Dashboard (retorna solo el array)
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/lotes/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put('/lotes/', { ...data, lot_id: id });
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id, config) => {
    const res = await api.delete(`/lotes/${id}`, config);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
