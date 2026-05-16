import api from '../axios';

export const lotesService = {
  listar: async () => {
    const res = await api.get('/lotes/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/lotes/', data);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put('/lotes/', { ...data, lot_id: id });
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/lotes/${id}`);
    return res.data;
  }
};
