import api from '../axios';

export const proveedoresProductosService = {
  listar: async () => {
    const res = await api.get('/proveedores_productos/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/proveedores_productos/', data);
    return res.data;
  }
};
