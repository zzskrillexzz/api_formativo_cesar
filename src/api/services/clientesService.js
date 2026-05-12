import api from '../axios';

export const clientesService = {
  listar: async () => {
    const res = await api.get('/clientes/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/clientes/', data);
    return res.data;
  },
  editar: async (data) => {
    const res = await api.put('/clientes/', data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/clientes/eliminar/${id}`);
    return res.data;
  },
  buscar: async () => {
    const res = await api.get('/clientes/buscar');
    return res.data;
  }
};
