import api from '../axios';

export const masVendidosService = {
  listar: async () => {
    const res = await api.get('/mas_vendidos/');
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
