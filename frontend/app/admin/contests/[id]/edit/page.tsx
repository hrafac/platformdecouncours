'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categories, mockContests } from '@/lib/mockData';
import type { Contest, ContestStatus } from '@/types';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContestFormData {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: ContestStatus;
  location: string;
  positions: number;
}

export default function EditContestPage() {
  const params = useParams();
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContestFormData>();

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const foundContest = mockContests.find((c) => c.id === params.id);
      if (foundContest) {
        setContest(foundContest);
        setRequirements(foundContest.requirements);
        reset({
          title: foundContest.title,
          description: foundContest.description,
          category: foundContest.category,
          startDate: foundContest.startDate,
          endDate: foundContest.endDate,
          status: foundContest.status,
          location: foundContest.location,
          positions: foundContest.positions,
        });
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.id, reset]);

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((_, i) => i !== index));
    }
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const onSubmit = async (data: ContestFormData) => {
    setIsSubmitting(true);

    const validRequirements = requirements.filter((r) => r.trim() !== '');

    if (validRequirements.length === 0) {
      toast.error('Ajoutez au moins une condition requise');
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log('Contest updated:', { ...data, requirements: validRequirements });
    toast.success('Concours mis à jour avec succès');
    router.push('/admin');
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <Loader fullScreen />
      </ProtectedRoute>
    );
  }

  if (!contest) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold">Concours non trouvé</h1>
          <Button className="mt-6" asChild>
            <Link href="/admin">Retour au tableau de bord</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Modifier le concours</CardTitle>
              <CardDescription>
                Modifiez les informations du concours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du concours</Label>
                  <Input
                    id="title"
                    {...register('title', {
                      required: 'Le titre est requis',
                      minLength: {
                        value: 10,
                        message: 'Le titre doit contenir au moins 10 caractères',
                      },
                    })}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    {...register('description', {
                      required: 'La description est requise',
                      minLength: {
                        value: 50,
                        message: 'La description doit contenir au moins 50 caractères',
                      },
                    })}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      defaultValue={contest.category}
                      onValueChange={(value) => setValue('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      defaultValue={contest.status}
                      onValueChange={(value) => setValue('status', value as ContestStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPCOMING">À venir</SelectItem>
                        <SelectItem value="OPEN">Ouvert</SelectItem>
                        <SelectItem value="CLOSED">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate', {
                        required: 'La date de début est requise',
                      })}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate', {
                        required: 'La date de fin est requise',
                      })}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      {...register('location', {
                        required: 'Le lieu est requis',
                      })}
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive">{errors.location.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="positions">Nombre de postes</Label>
                    <Input
                      id="positions"
                      type="number"
                      min="1"
                      {...register('positions', {
                        required: 'Le nombre de postes est requis',
                        min: { value: 1, message: 'Le nombre minimum est 1' },
                      })}
                    />
                    {errors.positions && (
                      <p className="text-sm text-destructive">{errors.positions.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Conditions requises</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Condition ${index + 1}`}
                          value={req}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                        />
                        {requirements.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRequirement(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/admin">Annuler</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      'Enregistrer les modifications'
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
