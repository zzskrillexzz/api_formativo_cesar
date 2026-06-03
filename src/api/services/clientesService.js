import api from '../axios';

export const clientesService = {
  listar: async (params = {}) => {
    const res = await api.get('/clientes/', { params });
    // Si se pidió paginación explícita, retornamos el objeto completo
    if (params.page || params.limit) return res.data;
    // Sin params: compatibilidad con Dashboard (retorna solo el array)
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/clientes/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (data) => {
    const res = await api.put('/clientes/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/clientes/eliminar/${id}`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  buscar: async () => {
    const res = await api.get('/clientes/buscar');
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
