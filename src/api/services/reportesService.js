import api from '../axios';

export const reportesService = {
  listar: async () => {
    const res = await api.get('/reportes/');
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
