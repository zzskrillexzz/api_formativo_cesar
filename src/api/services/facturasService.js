import api from '../axios';

export const facturasService = {
  listar: async () => {
    const res = await api.get('/facturas/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/facturas/', data);
    return res.data;
  },
  buscar: async (id) => {
    const res = await api.get(`/facturas/${id}`);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/facturas/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/facturas/${id}`);
    return res.data;
  }
};
