// Types for the Contest Management Platform

export type UserRole = 'ADMIN' | 'CANDIDATE';

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ContestStatus = 'OPEN' | 'CLOSED' | 'UPCOMING';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: ContestStatus;
  requirements: string[];
  location: string;
  positions: number;
  createdAt: string;
}

export interface Application {
  id: string;
  contestId: string;
  contestTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  cvUrl: string;
  coverLetter: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ContestsState {
  contests: Contest[];
  currentContest: Contest | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

export interface ApplicationsState {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface ApplicationFormData {
  name: string;
  email: string;
  coverLetter: string;
  cv: FileList;
  portfolioUrl?: string;
  linkedinProfile?: string;
  additionalInfo?: string;
  expectedSalary?: string;
  availabilityDate?: string;
}

export interface Candidate {
  id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  skills?: string;
  experience?: string;
}

export interface CandidateFormData {
  fullName: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
}

export interface CandidateState {
  candidate: Candidate | null;
  isLoading: boolean;
  error: string | null;
}

export interface JobOffer {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  salary: number;
  location: string;
  type: string;
  competitionDate: string | null;
  competitionTime: string | null;
  competitionStatus: string | null;
}

export interface JobApplication {
  id: number;
  candidateId: number;
  jobId: number;
  matchScore: number;
  status: string;
  applicationDate: string;
  cvContent: string;
  cvFileName: string;
  coverLetter: string;
  portfolioUrl?: string;
  linkedinProfile?: string;
  additionalInfo?: string;
  expectedSalary?: string;
  availabilityDate?: string;
}
