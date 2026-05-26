import api from '../axios';

export const inventariosMovimientosService = {
  registrar: async (data) => {
    const res = await api.post('/inventarios_movimientos/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
