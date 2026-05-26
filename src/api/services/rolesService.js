import api from '../axios';

export const rolesService = {
  listar: () => api.get('/roles/'),

  buscar: (rol_id) => api.get('/roles/buscar', { params: { rol_id } }),

  registrar: (data) => api.post('/roles/', data),

  editar: (data) => api.put('/roles/', data),

  eliminar: (rol_id) => api.delete(`/roles/eliminar/${rol_id}`),
};
