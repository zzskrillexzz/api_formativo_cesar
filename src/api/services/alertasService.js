import api from '../axios';

export const alertasService = {
  listar: async () => {
    const res = await api.get('/alertas_vencimientos/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/alertas_vencimientos/', data);
    return res.data;
  }
};
