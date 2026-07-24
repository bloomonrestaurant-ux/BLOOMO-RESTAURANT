import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CHEF' | 'WAITER' | 'DELIVERY' | 'CUSTOMER';
  phone?: string;
  walletBalance: number;
  loyaltyPoints: number;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    updateWallet: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.walletBalance = Number(state.user.walletBalance) + action.payload;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      }
    },
    syncStorage: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
          state.token = token;
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
        }
      }
    },
  },
});

export const { setCredentials, logout, updateWallet, syncStorage } = authSlice.actions;
export default authSlice.reducer;
