'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
import { useAppSelector } from '@/hooks/useRedux';
import { applicationService } from '@/services/applicationService';
import type { Application, JobApplication } from '@/types';
import { 
  Briefcase, 
  Calendar, 
  FileText, 
  ExternalLink, 
  Linkedin, 
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';


export default function ApplicationsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Using hardcoded candidateId=4 for now, should come from user context
        const data = await applicationService.getAppliedJobsByCandidate(4);
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Erreur lors du chargement de vos candidatures');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'En attente',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
          icon: AlertCircle
        };
      case 'ACCEPTED':
        return {
          label: 'Acceptée',
          className: 'bg-green-500/10 text-green-600 border-green-500/20',
          icon: CheckCircle
        };
      case 'REJECTED':
        return {
          label: 'Refusée',
          className: 'bg-red-500/10 text-red-600 border-red-500/20',
          icon: XCircle
        };
      default:
        return {
          label: status,
          className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
          icon: AlertCircle
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['CANDIDATE']}>
        <Loader fullScreen />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Mes candidatures</h1>
            <p className="mt-2 text-muted-foreground">
              Suivez l'état de vos candidatures et gérez vos postulations
            </p>
          </div>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Aucune candidature</h3>
                  <p className="mt-2 text-muted-foreground">
                    Vous n'avez pas encore postulé à des offres d'emploi.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/contests">Voir les offres d'emploi</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => {
                const statusConfig = getStatusConfig(application.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Offre #{application.jobId}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Postulé le {formatDate(application.applicationDate)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={statusConfig.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Match Score */}
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Score de matching</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {application.matchScore.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {application.matchScore > 70 ? 'Excellent' : 
                             application.matchScore > 50 ? 'Bon' : 
                             application.matchScore > 30 ? 'Moyen' : 'Faible'}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Documents */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documents
                        </h4>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">CV:</span>
                            <span className="font-medium">{application.cvFileName}</span>
                          </div>
                          {application.coverLetter && (
                            <div className="flex items-start justify-between text-sm">
                              <span className="text-muted-foreground">Lettre de motivation:</span>
                              <span className="font-medium max-w-xs text-right">
                                {application.coverLetter.length > 50 
                                  ? application.coverLetter.substring(0, 50) + '...'
                                  : application.coverLetter}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(application.portfolioUrl || application.linkedinProfile || 
                        application.expectedSalary || application.availabilityDate) && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="font-medium">Informations complémentaires</h4>
                            <div className="grid gap-2 text-sm">
                              {application.expectedSalary && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Salaire souhaité:</span>
                                  <span className="font-medium">{application.expectedSalary}</span>
                                </div>
                              )}
                              {application.availabilityDate && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Disponibilité:</span>
                                  <span className="font-medium">{application.availabilityDate}</span>
                                </div>
                              )}
                              {application.portfolioUrl && (
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Portfolio:</span>
                                  <a 
                                    href={application.portfolioUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                  >
                                    Voir
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              {application.linkedinProfile && (
                                <div className="flex items-center gap-2">
                                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">LinkedIn:</span>
                                  <a 
                                    href={application.linkedinProfile} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                  >
                                    Voir
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/jobs/${application.jobId}`}>
                            Voir l'offre
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Modifier la candidature
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
