'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import { useAppSelector } from '@/hooks/useRedux';
import { mockContests } from '@/lib/mockData';
import type { Contest, ApplicationFormData } from '@/types';
import { applicationService } from '@/services/applicationService';
import { ArrowLeft, Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ApplicationFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const foundContest = mockContests.find((c) => c.id === params.id);
      setContest(foundContest || null);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.id]);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);

    try {
      // Read CV file and convert to base64
      let cvBase64 = '';
      let cvFileName = 'cv.pdf';
      
      if (data.cv && data.cv[0]) {
        const file = data.cv[0];
        cvFileName = file.name;
        cvBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      
      // Create application data object
      const applicationData = {
        cvContent: cvBase64,
        cvFileName: cvFileName,
        coverLetter: data.coverLetter || '',
        portfolioUrl: data.portfolioUrl || '',
        linkedinProfile: data.linkedinProfile || '',
        additionalInfo: data.additionalInfo || '',
        expectedSalary: data.expectedSalary || '',
        availabilityDate: data.availabilityDate || ''
      };
      
      // Submit application using JSON method
      await applicationService.submitApplicationWithJSON(4, 1, applicationData);
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Candidature soumise avec succès!');
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsSubmitting(false);
      toast.error('Erreur lors de la soumission de la candidature');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Veuillez sélectionner un fichier PDF');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5 Mo');
        e.target.value = '';
        return;
      }
      setSelectedFileName(file.name);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <Loader fullScreen />
      </ProtectedRoute>
    );
  }

  if (!contest) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold">Concours non trouvé</h1>
          <Button className="mt-6" asChild>
            <Link href="/contests">Retour aux concours</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  if (contest.status !== 'OPEN') {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Candidature impossible</h1>
          <p className="mt-2 text-muted-foreground">
            Ce concours n&apos;accepte plus de candidatures.
          </p>
          <Button className="mt-6" asChild>
            <Link href={`/contests/${contest.id}`}>Retour aux détails</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  if (isSubmitted) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Candidature envoyée!</h1>
          <p className="mt-2 max-w-md text-center text-muted-foreground">
            Votre candidature pour le concours &quot;{contest.title}&quot; a été soumise avec succès.
            Vous recevrez une notification par email concernant l&apos;état de votre candidature.
          </p>
          <div className="mt-8 flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Mes candidatures</Link>
            </Button>
            <Button asChild>
              <Link href="/contests">Autres concours</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href={`/contests/${contest.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux détails
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Postuler au concours</CardTitle>
              <CardDescription>{contest.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    placeholder="Votre nom complet"
                    {...register('name', {
                      required: 'Le nom est requis',
                      minLength: {
                        value: 2,
                        message: 'Le nom doit contenir au moins 2 caractères',
                      },
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
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

                {/* CV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cv">CV (PDF uniquement, max 5 Mo)</Label>
                  <div className="relative">
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      {...register('cv', {
                        required: 'Le CV est requis',
                      })}
                      onChange={(e) => {
                        register('cv').onChange(e);
                        handleFileChange(e);
                      }}
                    />
                    <label
                      htmlFor="cv"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
                    >
                      {selectedFileName ? (
                        <>
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{selectedFileName}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Cliquez pour télécharger votre CV
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                  {errors.cv && (
                    <p className="text-sm text-destructive">{errors.cv.message}</p>
                  )}
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Lettre de motivation</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                    rows={6}
                    {...register('coverLetter', {
                      required: 'La lettre de motivation est requise',
                      minLength: {
                        value: 100,
                        message: 'La lettre doit contenir au moins 100 caractères',
                      },
                    })}
                  />
                  {errors.coverLetter && (
                    <p className="text-sm text-destructive">{errors.coverLetter.message}</p>
                  )}
                </div>

                {/* Portfolio URL */}
                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl">URL du Portfolio (facultatif)</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    placeholder="https://votreportfolio.com"
                    {...register('portfolioUrl')}
                  />
                </div>

                {/* LinkedIn Profile */}
                <div className="space-y-2">
                  <Label htmlFor="linkedinProfile">Profil LinkedIn (facultatif)</Label>
                  <Input
                    id="linkedinProfile"
                    type="url"
                    placeholder="https://linkedin.com/in/votrenom"
                    {...register('linkedinProfile')}
                  />
                </div>

                {/* Additional Info */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Informations supplémentaires (facultatif)</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Toute information additionnelle pertinente..."
                    rows={3}
                    {...register('additionalInfo')}
                  />
                </div>

                {/* Expected Salary */}
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary">Salaire souhaité (facultatif)</Label>
                  <Input
                    id="expectedSalary"
                    type="text"
                    placeholder="Ex: 50000DH ou Négociable"
                    {...register('expectedSalary')}
                  />
                </div>

                {/* Availability Date */}
                <div className="space-y-2">
                  <Label htmlFor="availabilityDate">Date de disponibilité (facultatif)</Label>
                  <Input
                    id="availabilityDate"
                    type="date"
                    {...register('availabilityDate')}
                  />
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    En soumettant cette candidature, vous confirmez que les informations fournies sont exactes et complètes.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre ma candidature'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
