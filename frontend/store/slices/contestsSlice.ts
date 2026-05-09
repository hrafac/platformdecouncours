import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contestService } from '@/services/contestService';
import type { ContestsState, Contest } from '@/types';
import toast from 'react-hot-toast';

const initialState: ContestsState = {
  contests: [],
  currentContest: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
};

interface FetchContestsParams {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchContests = createAsyncThunk(
  'contests/fetchContests',
  async (params: FetchContestsParams = {}, { rejectWithValue }) => {
    try {
      const response = await contestService.getContests(params);
      return response;
    } catch {
      return rejectWithValue('Erreur lors du chargement des concours');
    }
  }
);

export const fetchContestById = createAsyncThunk(
  'contests/fetchContestById',
  async (id: string, { rejectWithValue }) => {
    try {
      const contest = await contestService.getContestById(id);
      return contest;
    } catch {
      return rejectWithValue('Concours non trouvé');
    }
  }
);

export const createContest = createAsyncThunk(
  'contests/createContest',
  async (contest: Omit<Contest, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const newContest = await contestService.createContest(contest);
      toast.success('Concours créé avec succès');
      return newContest;
    } catch {
      return rejectWithValue('Erreur lors de la création du concours');
    }
  }
);

export const updateContest = createAsyncThunk(
  'contests/updateContest',
  async ({ id, contest }: { id: string; contest: Partial<Contest> }, { rejectWithValue }) => {
    try {
      const updatedContest = await contestService.updateContest(id, contest);
      toast.success('Concours mis à jour avec succès');
      return updatedContest;
    } catch {
      return rejectWithValue('Erreur lors de la mise à jour du concours');
    }
  }
);

export const deleteContest = createAsyncThunk(
  'contests/deleteContest',
  async (id: string, { rejectWithValue }) => {
    try {
      await contestService.deleteContest(id);
      toast.success('Concours supprimé avec succès');
      return id;
    } catch {
      return rejectWithValue('Erreur lors de la suppression du concours');
    }
  }
);

const contestsSlice = createSlice({
  name: 'contests',
  initialState,
  reducers: {
    clearCurrentContest: (state) => {
      state.currentContest = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contests
      .addCase(fetchContests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contests = action.payload.contests;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchContests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch contest by ID
      .addCase(fetchContestById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContestById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentContest = action.payload;
      })
      .addCase(fetchContestById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create contest
      .addCase(createContest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createContest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contests.unshift(action.payload);
      })
      .addCase(createContest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update contest
      .addCase(updateContest.fulfilled, (state, action) => {
        const index = state.contests.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contests[index] = action.payload;
        }
        if (state.currentContest?.id === action.payload.id) {
          state.currentContest = action.payload;
        }
      })
      // Delete contest
      .addCase(deleteContest.fulfilled, (state, action) => {
        state.contests = state.contests.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearCurrentContest, clearError } = contestsSlice.actions;
export default contestsSlice.reducer;
