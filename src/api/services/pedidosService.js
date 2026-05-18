import api from '../axios';

export const pedidosService = {
  listar: async () => {
    const res = await api.get('/pedidos/');
    return res.data;
  },
  buscar: async (id) => {
    const res = await api.get(`/pedidos/${id}`);
    return res.data;
  },
  subirComprobante: async (id, data) => {
    const res = await api.put(`/pedidos/${id}/comprobante`, data);
    return res.data;
  },
  avanzarEstado: async (id) => {
    const res = await api.put(`/pedidos/${id}/avanzar-estado`);
    return res.data;
  },
  enviarFactura: async (id) => {
    const res = await api.post(`/pedidos/${id}/enviar-factura`);
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/pedidos/', data);
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/pedidos/${id}`, data);
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/pedidos/${id}`);
    return res.data;
  },
  verificarPago: async (id, estado_pago) => {
    const res = await api.put(`/pedidos/${id}/verificar-pago`, { estado_pago });
    return res.data;
  },
  notificar: async (id, medio = 'ambos') => {
    const res = await api.post(`/pedidos/${id}/notificar`, { medio });
    return res.data;
  }
};
