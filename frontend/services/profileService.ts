import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface UserProfile {
  id?: number;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
}

export const profileService = {
  // Récupérer le profil du candidat
  async getProfile(candidateId: number): Promise<UserProfile> {
    try {
      const response = await axios.get(`${API_BASE_URL}/candidates/user/${candidateId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Si le profil n'existe pas, retourner un profil vide
        return {
          userId: candidateId.toString(),
          fullName: '',
          email: '',
          phone: '',
          skills: '',
          experience: ''
        };
      }
      throw error;
    }
  },

  // Créer un nouveau profil de candidat
  async createProfile(profileData: UserProfile): Promise<UserProfile> {
    const response = await axios.post(
      `${API_BASE_URL}/candidates`,
      profileData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Mettre à jour le profil du candidat
  async updateProfile(candidateId: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // D'abord essayer de mettre à jour par userId (plus sûr)
      try {
        const response = await axios.put(
          `${API_BASE_URL}/candidates/user/${candidateId}`,
          profileData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        return response.data;
      } catch (userIdError: any) {
        // Si l'endpoint par userId ne fonctionne pas, essayer par ID
        if (userIdError.response?.status === 404) {
          const response = await axios.put(
            `${API_BASE_URL}/candidates/${candidateId}`,
            profileData,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          return response.data;
        }
        throw userIdError;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Si le profil n'existe pas, le créer
        const newProfile: UserProfile = {
          userId: candidateId.toString(),
          fullName: profileData.fullName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          skills: profileData.skills || '',
          experience: profileData.experience || ''
        };
        return await this.createProfile(newProfile);
      }
      throw error;
    }
  },
};
