import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { candidateService } from '@/services/candidateService';
import type { CandidateState, Candidate, CandidateFormData } from '@/types';

const initialState: CandidateState = {
  candidate: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const createCandidate = createAsyncThunk(
  'candidate/create',
  async (candidateData: CandidateFormData & { userId: string }, { rejectWithValue }) => {
    try {
      const response = await candidateService.createCandidate(candidateData);
      return response;
    } catch (error) {
      return rejectWithValue('Erreur lors de la création du profil candidat');
    }
  }
);

export const fetchCandidateByUserId = createAsyncThunk(
  'candidate/fetchByUserId',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await candidateService.getCandidateByUserId(userId);
      return response;
    } catch (error) {
      return rejectWithValue('Erreur lors de la récupération du profil candidat');
    }
  }
);

export const updateCandidate = createAsyncThunk(
  'candidate/update',
  async ({ id, data }: { id: string; data: Partial<CandidateFormData> }, { rejectWithValue }) => {
    try {
      const response = await candidateService.updateCandidate(id, data);
      return response;
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour du profil candidat');
    }
  }
);

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCandidate: (state) => {
      state.candidate = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Candidate
      .addCase(createCandidate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidate = action.payload;
      })
      .addCase(createCandidate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Candidate by UserId
      .addCase(fetchCandidateByUserId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidateByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidate = action.payload;
      })
      .addCase(fetchCandidateByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Candidate
      .addCase(updateCandidate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.candidate = action.payload;
      })
      .addCase(updateCandidate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetCandidate } = candidateSlice.actions;
export default candidateSlice.reducer;
