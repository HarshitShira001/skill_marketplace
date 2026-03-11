import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Helper: safely read from localStorage
const readFromStorage = (key, parse = false) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) return null;
    return parse ? JSON.parse(val) : val;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Synchronous initializers — user & token are populated on the FIRST render.
  const [user, setUser] = useState(() => {
    const savedUser = readFromStorage('gigspark_user', true);
    // basic validation: if it doesn't have a role, it's potentially corrupted or old
    return (savedUser && savedUser.role) ? savedUser : null;
  });
  const [token, setToken] = useState(() => readFromStorage('gigspark_token'));

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('gigspark_user', JSON.stringify(userData));
      localStorage.setItem('gigspark_token', authToken);
    } catch (err) {
      console.error('AuthContext: Failed to save to localStorage', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('gigspark_user');
      localStorage.removeItem('gigspark_token');
    } catch (err) {
      console.error('AuthContext: Failed to clear localStorage', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;


