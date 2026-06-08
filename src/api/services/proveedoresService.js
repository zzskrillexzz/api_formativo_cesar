import api from '../axios';

export const proveedoresService = {
  listar: async (params = {}) => {
    const res = await api.get('/proveedores/', { params });
    if (params.page || params.limit) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/proveedores/', data);
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return res.data;
  },
  buscar: async (prov_id) => {
    const res = await api.get('/proveedores/buscar', { params: { prov_id } });
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put('/proveedores/', { id, ...data });
    return res.data;
  },
  eliminar: async (prov_id) => {
    const res = await api.delete(`/proveedores/eliminar/${prov_id}`);
    return res.data;
  }
};
