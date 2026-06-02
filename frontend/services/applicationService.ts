import api from './api';
import type { Application, ApplicationStatus } from '@/types';

export const applicationService = {
  async submitApplication(candidateId: number, jobId: number, formData: FormData): Promise<Application> {
    const response = await api.post<Application>(`/applications/apply?candidateId=${candidateId}&jobId=${jobId}`, formData, {
      // Ne pas définir Content-Type manuellement pour FormData
      // Le navigateur le fera automatiquement avec le bon boundary
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  async submitApplicationWithJSON(candidateId: number, jobId: number, applicationData: any): Promise<Application> {
    const response = await api.post<Application>(`/applications/apply?candidateId=${candidateId}&jobId=${jobId}`, applicationData, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  async getMyApplications(): Promise<Application[]> {
    const response = await api.get<Application[]>('/applications/me');
    return response.data;
  },

  async getAppliedJobsByCandidate(candidateId: number): Promise<any[]> {
    const response = await api.get<any[]>(`/applications/candidate/${candidateId}/jobs`, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  async getAppliedJobsDetailsByCandidate(candidateId: number): Promise<any[]> {
    const response = await api.get<any[]>(`/applications/candidate/${candidateId}/jobs/details`, {
      baseURL: 'http://localhost:8080/api'
    });
    return response.data;
  },

  async getApplicationsByContest(contestId: string): Promise<Application[]> {
    const response = await api.get<Application[]>(`/applications/contest/${contestId}`);
    return response.data;
  },

  async getAllApplications(): Promise<Application[]> {
    const response = await api.get<Application[]>('/applications');
    return response.data;
  },

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const response = await api.patch<Application>(`/applications/${id}/status?status=${status}`);
    return response.data;
  },
};
