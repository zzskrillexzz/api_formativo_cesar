import api from '../axios';

export const detallesPedidosService = {
  listar: async () => {
    const res = await api.get('/detalles_pedidos/');
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/detalles_pedidos/', data);
    return res.data;
  }
};
