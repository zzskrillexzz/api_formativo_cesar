import api from '../axios';

export const comprasService = {
  listar: async () => {
    const res = await api.get('/compras/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/compras/', data);
    return res.data;
  }
};
