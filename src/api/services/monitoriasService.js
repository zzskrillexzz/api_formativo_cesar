import api from '../axios';

export const monitoriasService = {
  listar: async () => {
    const res = await api.get('/monitorias/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/monitorias/', data);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/monitorias/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/monitorias/${id}`);
    return res.data;
  },
  buscar: async () => {
    const res = await api.get('/monitorias/buscar');
    return res.data;
  }
};
