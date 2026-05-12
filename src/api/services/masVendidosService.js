import api from '../axios';

export const masVendidosService = {
  listar: async () => {
    const res = await api.get('/mas_vendidos/');
    return res.data;
  }
};
