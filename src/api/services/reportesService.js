import api from '../axios';

export const reportesService = {
  listar: async () => {
    const res = await api.get('/reportes/');
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  },

  /** Generar reporte real: GET /reportes/generar/<tipo>?fecha_desde=&fecha_hasta= */
  generar: async (tipo, params = {}) => {
    const query = new URLSearchParams();
    if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
    if (params.dias) query.set('dias', params.dias);
    const qs = query.toString();
    const res = await api.get(`/reportes/generar/${tipo}${qs ? '?' + qs : ''}`);
    return res.data;
  },

  /** Exportar reporte: GET /reportes/exportar/<tipo>/<formato>?fecha_desde=&fecha_hasta=&dias= */
  exportar: async (tipo, formato, params = {}) => {
    const query = new URLSearchParams();
    if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
    if (params.dias) query.set('dias', params.dias);
    const qs = query.toString();
    const res = await api.get(`/reportes/exportar/${tipo}/${formato}${qs ? '?' + qs : ''}`, {
      responseType: 'blob'
    });
    return res.data;
  }
};