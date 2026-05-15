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
  editar: async (data) => {
    const res = await api.put('/lotes/', data);
    return res.data;
  }
};
