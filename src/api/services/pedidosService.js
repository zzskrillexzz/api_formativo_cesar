import api from '../axios';

export const pedidosService = {
  listar: async () => {
    const res = await api.get('/pedidos/');
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  buscar: async (id) => {
    const res = await api.get(`/pedidos/${id}`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  subirComprobante: async (id, data) => {
    const res = await api.put(`/pedidos/${id}/comprobante`, data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  avanzarEstado: async (id) => {
    const res = await api.put(`/pedidos/${id}/avanzar-estado`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  enviarFactura: async (id) => {
    const res = await api.post(`/pedidos/${id}/enviar-factura`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  registrar: async (data) => {
    const res = await api.post('/pedidos/', data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  editar: async (id, data) => {
    const res = await api.put(`/pedidos/${id}`, data);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  eliminar: async (id) => {
    const res = await api.delete(`/pedidos/${id}`);
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  verificarPago: async (id, estado_pago) => {
    const res = await api.put(`/pedidos/${id}/verificar-pago`, { estado_pago });
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },
  notificar: async (id, medio = 'ambos') => {
    const res = await api.post(`/pedidos/${id}/notificar`, { medio });
    // El backend ahora retorna {data: [...], total, page, limit, pages}
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
};
