'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useRedux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader, Save, ArrowLeft, UserCircle, Mail, Phone, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { profileService, UserProfile } from '@/services/profileService';

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    experience: ''
  });

  console.log('User object from Redux:', user);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        
        const data = await profileService.getProfile(Number(user.id));
        setProfile({
          userId: data.userId || user.id.toString(),
          fullName: data.fullName || user.name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          skills: data.skills || '',
          experience: data.experience || ''
        });
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        // Utiliser les données de base si le service échoue
        if (user) {
          setProfile({
            userId: user.id.toString(),
            fullName: user.name || '',
            email: user.email || '',
            phone: '',
            skills: '',
            experience: ''
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      await profileService.updateProfile(Number(user.id), profile);
      alert('Profil mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserCircle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
                <p className="text-gray-600">Gérez vos informations personnelles</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles et professionnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Nom complet */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      Nom complet
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder={
                        user && user.name !== 'Utilisateur' ? user.name :
                        user?.email ? user.email.split('@')[0] : "Votre nom complet"
                      }
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="votre.email@exemple.com"
                      required
                    />
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Compétences */}
                <div className="space-y-2">
                  <Label htmlFor="skills" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Compétences
                  </Label>
                  <Textarea
                    id="skills"
                    value={profile.skills}
                    onChange={(e) => handleChange('skills', e.target.value)}
                    placeholder="Java, Spring, React, PostgreSQL, Docker..."
                    rows={3}
                  />
                </div>

                {/* Expérience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Expérience professionnelle</Label>
                  <Textarea
                    id="experience"
                    value={profile.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    placeholder="6 ans en développement Java/Spring..."
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
