import api from '../axios';

export const reportesService = {
  listar: async () => {
    const res = await api.get('/reportes/');
    return res.data;
  }
};
