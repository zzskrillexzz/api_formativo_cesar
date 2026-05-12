import api from '../axios';

export const proveedoresService = {
  listar: async () => {
    const res = await api.get('/proveedores/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/proveedores/', data);
    return res.data;
  }
};
