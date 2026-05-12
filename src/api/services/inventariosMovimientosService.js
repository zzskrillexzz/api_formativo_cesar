import api from '../axios';

export const inventariosMovimientosService = {
  registrar: async (data) => {
    const res = await api.post('/inventarios_movimientos/', data);
    return res.data;
  }
};
