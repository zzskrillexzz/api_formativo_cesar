import api from '../axios';

export const comprasService = {
  listar: async () => {
    const res = await api.get('/compras/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/compras/', data);
    return res.data;
  },
  buscar: async (id) => {
    const res = await api.get(`/compras/${id}`);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/compras/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/compras/${id}`);
    return res.data;
  }
};
