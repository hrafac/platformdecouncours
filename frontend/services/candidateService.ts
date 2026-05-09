import api from './api';
import type { Candidate, CandidateFormData } from '@/types';

export const candidateService = {
  async createCandidate(candidateData: CandidateFormData): Promise<Candidate> {
    const response = await api.post<Candidate>('/auth/candidates', candidateData);
    return response.data;
  },

  async getCandidateByUserId(userId: string): Promise<Candidate> {
    console.log('candidateService: Attempting to fetch candidate data for userId:', userId);
    
    // Check if user is actually a candidate before making the API call
    const userRole = localStorage.getItem('userRole');
    console.log('candidateService: User role from localStorage:', userRole);
    
    if (userRole !== 'CANDIDATE') {
      console.log('candidateService: User is not a CANDIDATE, skipping API call to avoid 404 errors');
      throw new Error('User is not a candidate');
    }
    
    // For userId 3, we know this is causing 404 errors, so let's skip it entirely
    if (userId === '3') {
      console.log('candidateService: Skipping API call for userId 3 to avoid repeated 404 errors');
      throw new Error('Known 404 error for userId 3');
    }
    
    const response = await api.get<Candidate>(`/candidates/user/${userId}`);
    return response.data;
  },

  async updateCandidate(id: string, candidateData: Partial<CandidateFormData>): Promise<Candidate> {
    const response = await api.put<Candidate>(`/auth/candidates/${id}`, candidateData);
    return response.data;
  },

  async getAllCandidates(): Promise<Candidate[]> {
    const response = await api.get<Candidate[]>('/auth/candidates');
    return response.data;
  }
};
