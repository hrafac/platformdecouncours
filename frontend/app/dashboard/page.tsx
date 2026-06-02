'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/Loader';
import { useAppSelector } from '@/hooks/useRedux';
import { applicationService } from '@/services/applicationService';
import type { Application, JobApplication } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CandidateDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // 1. Récupérer le candidateId à partir du userId
        if (!user?.id) {
          setError("Utilisateur non connecté");
          setIsLoading(false);
          return;
        }
        const candidateRes = await fetch(`http://localhost:8080/api/candidates/user/${user.id}`);
        if (!candidateRes.ok) {
          throw new Error("Impossible de récupérer le candidat");
        }
        const candidate = await candidateRes.json();
        const candidateId = candidate.id;
        // 2. Charger les candidatures avec le candidateId
        const data = await applicationService.getAppliedJobsDetailsByCandidate(candidateId);
        setApplications(data);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Erreur lors du chargement de vos candidatures');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchApplications();
    }
  }, [user]);

  const statusConfig = {
    PENDING: {
      label: 'En attente',
      icon: Clock,
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    },
    ACCEPTED: {
      label: 'Accepté',
      icon: CheckCircle,
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    REJECTED: {
      label: 'Refusé',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
    },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper function to get job title from application
  const getJobTitle = (application: any) => {
    if (application.job && application.job.title) {
      return application.job.title;
    }
    return `Offre #${application.job?.id || application.jobId || 'N/A'}`;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const filterApplicationsByStatus = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter((a) => a.status === status);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return statusConfig.PENDING;
      case 'ACCEPTED':
        return statusConfig.ACCEPTED;
      case 'REJECTED':
        return statusConfig.REJECTED;
      default:
        return statusConfig.PENDING;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mon espace candidat</h1>
              <p className="mt-1 text-muted-foreground">
                Bienvenue, {user?.name}. Suivez vos candidatures ici.
              </p>
            </div>
            <Button asChild>
              <Link href="/contests">
                <Search className="mr-2 h-4 w-4" />
                Trouver une offre
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Loader fullScreen />
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total candidatures
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      En attente
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Acceptées
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Refusées
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Applications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Mes candidatures</CardTitle>
                  <CardDescription>
                    Historique de toutes vos candidatures aux offres d'emploi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
                      <TabsTrigger value="PENDING">En attente ({stats.pending})</TabsTrigger>
                      <TabsTrigger value="ACCEPTED">Acceptées ({stats.accepted})</TabsTrigger>
                      <TabsTrigger value="REJECTED">Refusées ({stats.rejected})</TabsTrigger>
                    </TabsList>

                    {['all', 'PENDING', 'ACCEPTED', 'REJECTED'].map((tab) => (
                      <TabsContent key={`tab-${tab}`} value={tab}>
                        {filterApplicationsByStatus(tab).length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Offre d'emploi</TableHead>
                                  <TableHead>Date de candidature</TableHead>
                                  <TableHead>Statut</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filterApplicationsByStatus(tab).map((application, index) => {
                                  const status = getStatusConfig(application.status);
                                  const StatusIcon = status.icon;
                                  return (
                                    <TableRow key={application.id || `application-${index}`}>
                                      <TableCell>
                                        <div className="max-w-[300px]">
                                          <p className="font-medium truncate">
                                            {getJobTitle(application)}
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {formatDate(application.applicationDate)}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={cn('gap-1', status.className)}
                                        >
                                          <StatusIcon className="h-3 w-3" />
                                          {status.label}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                          <Link href={`/jobs/${application.job?.id || application.jobId}`}>
                                            <ExternalLink className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <User className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Aucune candidature</h3>
                            <p className="mt-2 text-muted-foreground">
                              {tab === 'all'
                                ? "Vous n'avez pas encore postulé à un concours."
                                : 'Aucune candidature dans cette catégorie.'}
                            </p>
                            {tab === 'all' && (
                              <Button className="mt-4" asChild>
                                <Link href="/contests">Découvrir les concours</Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
