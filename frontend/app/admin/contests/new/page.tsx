'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
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
import { categories } from '@/lib/mockData';
import type { ContestStatus } from '@/types';
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

export default function NewContestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContestFormData>({
    defaultValues: {
      status: 'UPCOMING',
      positions: 1,
    },
  });

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

    // Filter empty requirements
    const validRequirements = requirements.filter((r) => r.trim() !== '');

    if (validRequirements.length === 0) {
      toast.error('Ajoutez au moins une condition requise');
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log('Contest created:', { ...data, requirements: validRequirements });
    toast.success('Concours créé avec succès');
    router.push('/admin');
    setIsSubmitting(false);
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Créer un nouveau concours</CardTitle>
              <CardDescription>
                Remplissez les informations pour créer un nouveau concours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du concours</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Concours Administrateur Systèmes"
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

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description détaillée du concours..."
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

                {/* Category & Status */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
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
                      defaultValue="UPCOMING"
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

                {/* Dates */}
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

                {/* Location & Positions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Rabat"
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
                        min: {
                          value: 1,
                          message: 'Le nombre minimum est 1',
                        },
                      })}
                    />
                    {errors.positions && (
                      <p className="text-sm text-destructive">{errors.positions.message}</p>
                    )}
                  </div>
                </div>

                {/* Requirements */}
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

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/admin">Annuler</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer le concours'
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
