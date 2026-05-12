import api from '../axios';

export const pedidosService = {
  listar: async () => {
    const res = await api.get('/pedidos/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/pedidos/', data);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/pedidos/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/pedidos/${id}`);
    return res.data;
  }
};
