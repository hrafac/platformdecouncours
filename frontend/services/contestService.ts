import api from './api';
import type { Contest } from '@/types';

interface ContestsResponse {
  contests: Contest[];
  totalPages: number;
  currentPage: number;
}

interface ContestFilters {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const contestService = {
  async getContests(filters: ContestFilters = {}): Promise<ContestsResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get<ContestsResponse>(`/contests?${params.toString()}`);
    return response.data;
  },

  async getContestById(id: string): Promise<Contest> {
    const response = await api.get<Contest>(`/contests/${id}`);
    return response.data;
  },

  async createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest> {
    const response = await api.post<Contest>('/contests', contest);
    return response.data;
  },

  async updateContest(id: string, contest: Partial<Contest>): Promise<Contest> {
    const response = await api.put<Contest>(`/contests/${id}`, contest);
    return response.data;
  },

  async deleteContest(id: string): Promise<void> {
    await api.delete(`/contests/${id}`);
  },
};
