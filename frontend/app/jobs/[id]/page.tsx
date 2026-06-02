'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Loader from '@/components/Loader';
import { useAppSelector } from '@/hooks/useRedux';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  Building,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobOffer {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  salary: number;
  location: string;
  type: string;
  competitionDate: string;
  competitionTime: string;
  competitionStatus: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [job, setJob] = useState<JobOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/jobs/${params.id}/details`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Offre d\'emploi non trouvée');
          } else {
            setError('Erreur lors du chargement des détails');
          }
          return;
        }

        const jobData = await response.json();
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (error || !job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold">
          {error || 'Offre d\'emploi non trouvée'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {error || 'L\'offre d\'emploi que vous recherchez n\'existe pas ou a été supprimée.'}
        </p>
        <Button className="mt-6" asChild>
          <Link href="/contests">Retour aux offres</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = {
    NOT_STARTED: { 
      label: 'Non commencé', 
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' 
    },
    IN_PROGRESS: { 
      label: 'En cours', 
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
    },
    COMPLETED: { 
      label: 'Terminé', 
      className: 'bg-green-500/10 text-green-600 border-green-500/20' 
    },
  };

  const typeConfig = {
    FULL_TIME: { label: 'Temps plein' },
    PART_TIME: { label: 'Temps partiel' },
    CONTRACT: { label: 'Contrat' },
  };

  const status = statusConfig[job.competitionStatus as keyof typeof statusConfig] || statusConfig.NOT_STARTED;
  const type = typeConfig[job.type as keyof typeof typeConfig] || { label: job.type };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(salary);
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // Rediriger vers la page de candidature
      router.push(`/jobs/${job.id}/apply`);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/contests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Link>
        </Button>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{type.label}</Badge>
                    <Badge variant="outline" className={cn(status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-4 text-2xl">{job.title}</CardTitle>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {job.company}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salaire</p>
                      <p className="text-sm font-medium">{formatSalary(job.salary)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Localisation</p>
                      <p className="text-sm font-medium">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date du concours</p>
                      <p className="text-sm font-medium">{formatDate(job.competitionDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heure du concours</p>
                      <p className="text-sm font-medium">{formatTime(job.competitionTime)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    Description
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                <Separator />

                {/* Requirements */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Compétences requises
                  </h3>
                  <div className="mt-3">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Competition Details */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Briefcase className="h-5 w-5" />
                    Détails du concours
                  </h3>
                  <div className="mt-3 space-y-2">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Statut:</span>{' '}
                      <Badge variant="outline" className={cn(status.className, 'ml-1')}>
                        {status.label}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Date:</span>{' '}
                      {formatDate(job.competitionDate)} à {formatTime(job.competitionTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        
        </div>
      </div>
    </div>
  );
}
