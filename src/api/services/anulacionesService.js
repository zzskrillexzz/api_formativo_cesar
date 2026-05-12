import api from '../axios';

export const anulacionesService = {
  listar: async () => {
    const res = await api.get('/anulaciones_ventas/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/anulaciones_ventas/', data);
    return res.data;
  }
};
