import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { applicationService } from '@/services/applicationService';
import type { ApplicationsState, ApplicationStatus } from '@/types';
import toast from 'react-hot-toast';

const initialState: ApplicationsState = {
  applications: [],
  isLoading: false,
  error: null,
};

export const submitApplication = createAsyncThunk(
  'applications/submit',
  async ({ contestId, formData }: { contestId: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const application = await applicationService.submitApplication(contestId, formData);
      toast.success('Candidature soumise avec succès');
      return application;
    } catch {
      return rejectWithValue('Erreur lors de la soumission de la candidature');
    }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'applications/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const applications = await applicationService.getMyApplications();
      return applications;
    } catch {
      return rejectWithValue('Erreur lors du chargement des candidatures');
    }
  }
);

export const fetchApplicationsByContest = createAsyncThunk(
  'applications/fetchByContest',
  async (contestId: string, { rejectWithValue }) => {
    try {
      const applications = await applicationService.getApplicationsByContest(contestId);
      return applications;
    } catch {
      return rejectWithValue('Erreur lors du chargement des candidatures');
    }
  }
);

export const fetchAllApplications = createAsyncThunk(
  'applications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const applications = await applicationService.getAllApplications();
      return applications;
    } catch {
      return rejectWithValue('Erreur lors du chargement des candidatures');
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'applications/updateStatus',
  async ({ id, status }: { id: string; status: ApplicationStatus }, { rejectWithValue }) => {
    try {
      const application = await applicationService.updateApplicationStatus(id, status);
      toast.success(`Candidature ${status === 'ACCEPTED' ? 'acceptée' : 'refusée'}`);
      return application;
    } catch {
      return rejectWithValue('Erreur lors de la mise à jour du statut');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit application
      .addCase(submitApplication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications.unshift(action.payload);
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch my applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch by contest
      .addCase(fetchApplicationsByContest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchApplicationsByContest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplicationsByContest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch all
      .addCase(fetchAllApplications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchAllApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      });
  },
});

export const { clearError } = applicationsSlice.actions;
export default applicationsSlice.reducer;
