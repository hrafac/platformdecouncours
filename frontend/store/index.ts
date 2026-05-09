import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contestsReducer from './slices/contestsSlice';
import applicationsReducer from './slices/applicationsSlice';
import candidateReducer from './slices/candidateSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contests: contestsReducer,
    applications: applicationsReducer,
    candidate: candidateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
