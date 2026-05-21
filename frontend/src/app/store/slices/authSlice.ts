import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI, LoginPayload, RegisterPayload } from '../../api/auth';

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'attendee' | 'organizer' | 'admin';
  avatar?: string;
  phone?: string;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  isInitializing: !!localStorage.getItem('accessToken'),
  error: null,
};

export const loginUser = createAsyncThunk('auth/login', async (credentials: LoginPayload, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials);
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  } catch (error: any) {
    const resData = error.response?.data;
    const message = resData?.message || resData?.errors?.[0]?.msg || 'Login failed';
    return rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data: RegisterPayload, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(data);
    return response.data;
  } catch (error: any) {
    const resData = error.response?.data;
    // Backend may return { message } or { errors: [{msg},...] }
    const message = resData?.message || resData?.errors?.[0]?.msg || 'Registration failed';
    return rejectWithValue(message);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authAPI.logout();
  } catch {
    // Ignore logout API errors — always clear local state
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.getProfile();
    return response.data.user;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => {
        // Registration succeeded — user must verify email before they can log in.
        // Do NOT set isAuthenticated or store tokens here.
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitializing = false;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { clearError, updateUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
