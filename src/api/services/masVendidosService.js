import api from '../axios';

export const masVendidosService = {
  listar: async () => {
    const res = await api.get('/mas_vendidos/');
    // El backend retorna {data: [...], total, page, limit, pages} o directamente un array
    if (res.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    // Fallback seguro: si la respuesta es un objeto con data pero no es array, lo envolvemos
    if (res.data && res.data.data && typeof res.data.data === 'object') {
      return [res.data.data];
    }
    return [];
  }
};
