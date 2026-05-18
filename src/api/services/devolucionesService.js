import api from '../axios';

export const devolucionesService = {
  listar: async () => {
    const res = await api.get('/devoluciones/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/devoluciones/', data);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/devoluciones/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/devoluciones/${id}`);
    return res.data;
  }
};
