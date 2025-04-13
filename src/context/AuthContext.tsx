import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

type User = {
  _id: string;
  name: string;
  email: string;
  [key: string]: any;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  checkUserStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  checkUserStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Checking user status...');
      
      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        // Get current user data
        const userData = await authService.getCurrentUser();
        if (userData) {
          console.log('AuthContext: User is authenticated, profile image exists:', !!userData.profileImage);
          setUser(userData);
        } else {
          console.log('AuthContext: Token exists but user data fetch failed');
          await authService.logout();
          setUser(null);
        }
      } else {
        console.log('AuthContext: User is not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Error checking user status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Logging in user...');
      const userData = await authService.login(email, password);
      console.log('AuthContext: Login successful');
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthContext: Registering user...');
      const userData = await authService.register(name, email, password);
      console.log('AuthContext: Registration successful');
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user...');
      await authService.logout();
      setUser(null);
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 