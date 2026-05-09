'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { createCandidate } from '@/store/slices/candidateSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, User, Mail, Phone, Briefcase } from 'lucide-react';
import type { CandidateFormData } from '@/types';
import toast from 'react-hot-toast';

export default function CandidateProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, user } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateFormData>();

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié et est un candidat
    if (!user || user.role !== 'CANDIDATE') {
      router.push('/register');
      return;
    }
  }, [user, router]);

  const onSubmit = async (data: CandidateFormData) => {
    if (!user?.id) {
      toast.error('Erreur: utilisateur non identifié');
      return;
    }

    try {
      const result = await dispatch(createCandidate({
        ...data,
        userId: user.id,
      }));
      
      if (createCandidate.fulfilled.match(result)) {
        toast.success('Profil candidat créé avec succès!');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du profil');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            Compléter votre profil
          </CardTitle>
          <CardDescription>
            Étape 2: Remplissez vos informations pour créer votre profil de candidat
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  {...register('fullName', {
                    required: 'Le nom complet est requis',
                    minLength: {
                      value: 2,
                      message: 'Le nom doit contenir au moins 2 caractères',
                    },
                  })}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email', {
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="phone"
                placeholder="06123456789"
                {...register('phone', {
                  required: 'Le téléphone est requis',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Le téléphone doit contenir 10 chiffres',
                  },
                })}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Compétences
              </Label>
              <Input
                id="skills"
                placeholder="Java, Spring, React, PostgreSQL"
                {...register('skills', {
                  required: 'Les compétences sont requises',
                  minLength: {
                    value: 5,
                    message: 'Veuillez décrire vos compétences',
                  },
                })}
              />
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Expérience</Label>
              <Textarea
                id="experience"
                placeholder="7 ans en développement Java/Spring..."
                rows={4}
                {...register('experience', {
                  required: 'L\'expérience est requise',
                  minLength: {
                    value: 10,
                    message: 'Veuillez décrire votre expérience',
                  },
                })}
              />
              {errors.experience && (
                <p className="text-sm text-destructive">{errors.experience.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du profil...
                </>
              ) : (
                'Terminer l\'inscription'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Les champs marqués d'un * sont obligatoires
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
