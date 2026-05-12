import api from '../axios';

export const usuariosService = {
  listar: async () => {
    const res = await api.get('/usuarios/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/usuarios/', data);
    return res.data;
  }
};
