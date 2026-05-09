import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import { candidateService } from '@/services/candidateService';
import type { AuthState, User, LoginCredentials, RegisterCredentials, UserRole } from '@/types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      // Store role in localStorage for persistence
      localStorage.setItem('userRole', response.role);
      
      // Fetch candidate data if user is a candidate
      let candidateData = null;
      if (response.role === 'CANDIDATE' && response.userId) {
        try {
          console.log('Fetching candidate data for userId:', response.userId);
          candidateData = await candidateService.getCandidateByUserId(response.userId);
        } catch (error) {
          console.log('Candidate profile not found for userId:', response.userId, '- continuing without candidate data');
          // Candidate profile might not exist yet, continue with login
        }
      } else {
        console.log('User is not a candidate or no userId provided, skipping candidate data fetch');
      }
      
      return { ...response, candidateData };
    } catch (error) {
      return rejectWithValue('Email ou mot de passe incorrect');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.register(credentials);
      localStorage.setItem('token', response.token);
      // Store role in localStorage for persistence
      localStorage.setItem('userRole', response.role);
      
      // Fetch candidate data if user is a candidate
      let candidateData = null;
      if (response.role === 'CANDIDATE' && response.userId) {
        try {
          console.log('Fetching candidate data for userId:', response.userId);
          candidateData = await candidateService.getCandidateByUserId(response.userId);
        } catch (error) {
          console.log('Candidate profile not found for userId:', response.userId, '- continuing without candidate data');
          // Candidate profile might not exist yet, continue with registration
        }
      } else {
        console.log('User is not a candidate or no userId provided, skipping candidate data fetch');
      }
      
      return { ...response, candidateData };
    } catch (error) {
      return rejectWithValue('Erreur lors de l\'inscription');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    if (!token || !userRole) {
      return rejectWithValue('Non authentifié');
    }
    
    console.log('checkAuth: Role=', userRole, 'UserId=', userId);
    
    // Fetch candidate data ONLY if user is a candidate AND we have a userId
    let candidateData = null;
    if (userRole === 'CANDIDATE' && userId) {
      try {
        console.log('User is CANDIDATE, fetching candidate data for userId:', userId);
        candidateData = await candidateService.getCandidateByUserId(userId);
      } catch (error) {
        console.log('Candidate profile not found for userId:', userId, '- continuing without candidate data');
        // Candidate profile might not exist yet
      }
    } else {
      console.log('User is ADMIN or no userId provided, skipping candidate data fetch completely');
    }
    
    // Create user object from stored role and candidate data
    const user: User = {
      id: userId || 'temp-id',
      email: candidateData?.email || 'temp-email',
      name: candidateData?.fullName || 'temp-name',
      role: userRole as UserRole,
      createdAt: new Date().toISOString(),
    };
    return { user, token, candidateData };
  } catch {
    return rejectWithValue('Session invalide');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        const { candidateData } = action.payload;
        // Create user object from backend response and candidate data
        state.user = {
          id: action.payload.userId || 'temp-id',
          email: candidateData?.email || 'temp-email',
          name: candidateData?.fullName || 'temp-name',
          role: action.payload.role as UserRole,
          createdAt: new Date().toISOString(),
        };
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // Store userId in localStorage for checkAuth
        if (action.payload.userId) {
          localStorage.setItem('userId', action.payload.userId);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        const { candidateData } = action.payload;
        // Create user object from backend response and candidate data
        state.user = {
          id: action.payload.userId,
          email: candidateData?.email || 'temp-email',
          name: candidateData?.fullName || 'temp-name',
          role: action.payload.role as UserRole,
          createdAt: new Date().toISOString(),
        };
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // Store userId in localStorage for checkAuth
        if (action.payload.userId) {
          localStorage.setItem('userId', action.payload.userId);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
