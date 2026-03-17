import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  pendingPhone: null,  // phone waiting for OTP
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_PENDING_PHONE':
      return { ...state, pendingPhone: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount — check for existing token
  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    const userStr = localStorage.getItem('wa_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        // Verify token is still valid
        authAPI.getMe()
          .then(data => {
            dispatch({ type: 'UPDATE_USER', payload: data.user });
            localStorage.setItem('wa_user', JSON.stringify(data.user));
          })
          .catch(() => {
            logout();
          });
      } catch {
        logout();
      }
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: null });
    }
  }, []);

  const register = async (formData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authAPI.register(formData);
      dispatch({ type: 'SET_PENDING_PHONE', payload: formData.get('phone') });
      return data;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  const sendOTP = async (phone) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authAPI.sendOTP(phone);
      dispatch({ type: 'SET_PENDING_PHONE', payload: phone });
      return data;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  const verifyOTP = async (phone, otp) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authAPI.verifyOTP(phone, otp);
      localStorage.setItem('wa_token', data.token);
      localStorage.setItem('wa_user', JSON.stringify(data.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: data.user, token: data.token } });
      return data;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('wa_token');
    localStorage.removeItem('wa_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    const updated = { ...state.user, ...userData };
    localStorage.setItem('wa_user', JSON.stringify(updated));
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider value={{
      ...state,
      register,
      sendOTP,
      verifyOTP,
      logout,
      updateUser,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
