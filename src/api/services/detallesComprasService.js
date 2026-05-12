import api from '../axios';

export const detallesComprasService = {
  listar: async () => {
    const res = await api.get('/detalles_compras/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/detalles_compras/', data);
    return res.data;
  }
};
