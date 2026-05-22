import api from '../axios';

export const authService = {
  login: async (correo, password) => {
    try {
      const response = await api.post('/login', { 
        usu_correo: correo,
        usu_contrasena: password
      });
      return response.data; // Retorna el usuario de la DB
    } catch (error) {
      const mensaje = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión';
      throw mensaje;
    }
  },
  logout: async () => {
    try {
      await api.post('/logout');
    } catch {
      // Si falla la petición, igual cerramos sesión localmente
    }
  }
};