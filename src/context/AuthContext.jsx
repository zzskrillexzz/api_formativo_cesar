import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../api/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Restaurar sesión desde sessionStorage al montar ──
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const userData = sessionStorage.getItem('user_data');
    if (token && userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setRole(parsed.role);
      setIsLogged(true);
    }
  }, []);

  const login = async (correo, password) => {
    setLoading(true);
    try {
      const result = await authService.login(correo, password);
      // result: { access_token, token_type, usu_nombre, usu_rol_id_fk }

      // ── Persistir token ──
      sessionStorage.setItem('access_token', result.access_token);

      // ── Persistir datos del usuario ──
      const userData = {
        id: result.usu_id,
        name: result.usu_nombre,
        initials: result.usu_nombre.substring(0, 2).toUpperCase(),
        role: result.usu_rol || result.usu_rol_id_fk
      };
      sessionStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
      setRole(result.usu_rol || result.usu_rol_id_fk);
      setIsLogged(true);

      return { success: true };
    } catch (error) {
      return { success: false, message: error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Intentar revocar el token en el servidor
    await authService.logout();
    // Limpiar estado local siempre (así falle el backend)
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_data');
    setIsLogged(false);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLogged, role, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);