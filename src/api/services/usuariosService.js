import api from '../axios';

export const usuariosService = {
  listar: async () => {
    const res = await api.get('/usuarios/');
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/usuarios/', data);
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  editar: async (data) => {
    const res = await api.put('/usuarios/', data);
    return res.data;
  },
  eliminar: async (usu_id) => {
    const res = await api.delete(`/usuarios/eliminar/${usu_id}`);
    return res.data;
  }
};
