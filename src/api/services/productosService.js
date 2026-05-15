import api from '../axios';

export const productosService = {
  listar: async () => {
    const res = await api.get('/productos/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/productos/', data);
    return res.data;
  },
  editar: async (data) => {
    const res = await api.put('/productos/', data);
    return res.data;
  }
};
