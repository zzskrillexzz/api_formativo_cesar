import api from '../axios';

export const devolucionesService = {
  listar: async () => {
    const res = await api.get('/devoluciones/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/devoluciones/', data);
    return res.data;
  }
};
