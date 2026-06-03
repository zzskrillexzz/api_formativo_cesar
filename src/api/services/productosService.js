import api from '../axios';

export const productosService = {
  listar: async (params = {}) => {
    const res = await api.get('/productos/', { params });
    // Si se pidió paginación explícita, retornamos el objeto completo
    if (params.page || params.limit) return res.data;
    // Sin params: compatibilidad con Dashboard (retorna solo el array)
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/productos/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put('/productos/', { ...data, id });
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id, config) => {
    const res = await api.delete(`/productos/${id}`, config);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
