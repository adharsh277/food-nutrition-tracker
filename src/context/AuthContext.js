import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import UserDataService from '../services/userDataService';
import StepTracker from '../services/StepTrackerService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('authUser');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // 🔧 Set user context for namespaced storage
        if (parsedUser.id || parsedUser._id) {
          UserDataService.setCurrentUserId(parsedUser.id || parsedUser._id);
        }
      }
    } catch (err) {
      console.log('Auth load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken, newUser) => {
    if (newUser.role !== 'USER') {
      await logout();
      return;
    }

    await SecureStore.setItemAsync('authToken', newToken);
    await SecureStore.setItemAsync('authUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    // 🔧 NEW: Set user context for namespaced storage
    // This ensures all data reads/writes are scoped to this user
    const userId = newUser.id || newUser._id;
    if (userId) {
      console.log('🔐 AuthContext: Setting user context:', userId);
      UserDataService.setCurrentUserId(userId);

      // Migrate any legacy non-namespaced data to this user's namespace
      await UserDataService.migrateToNamespacedStorage(userId);
    }
  };

  const logout = async () => {
    console.log('🔐 AuthContext: Logging out...');

    // Only clear auth tokens - DO NOT clear user data!
    // User data persists for next login
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('authUser');

    // Cleanup step tracker
    StepTracker.cleanup();

    // Clear user context (but not the actual data)
    UserDataService.clearUserContext();

    setUser(null);
    setToken(null);

    console.log('🔐 AuthContext: Logout complete (data preserved)');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
