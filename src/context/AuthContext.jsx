import React, { createContext, useState, useContext } from 'react';
import { authService } from '../api/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (correo, password) => {
    setLoading(true);
    try {
      const userData = await authService.login(correo, password);

      // Guardamos los datos reales de la base de datos
      setUser({
        name: userData.usu_nombre,
        initials: userData.usu_nombre.substring(0, 2).toUpperCase()
      });
      setRole(userData.usu_rol_id_fk); // Guardamos el ROL001, ROL002, etc.
      setIsLogged(true);

      return { success: true };
    } catch (error) {
      return { success: false, message: error };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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