"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Loader from '@/components/Loader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppSelector } from '@/hooks/useRedux';
import { applicationService } from '@/services/applicationService';
import { Users, Briefcase, Eye, Calendar } from 'lucide-react';

interface JobWithApplications {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: number;
  applicationCount: number;
}

export default function AdminJobsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobsWithApplications = async () => {
      try {
        // Récupérer toutes les candidatures avec détails des jobs
        const applications = await applicationService.getAppliedJobsDetailsByCandidate(0); // 0 pour tous les candidats
        
        // Grouper les applications par job
        const jobMap = new Map<number, JobWithApplications>();
        
        applications.forEach((app: any) => {
          const jobId = app.job?.id || app.jobId;
          if (jobId && app.job) {
            if (!jobMap.has(jobId)) {
              jobMap.set(jobId, {
                id: jobId,
                title: app.job.title || `Job #${jobId}`,
                company: app.job.company || 'N/A',
                location: app.job.location || 'N/A',
                type: app.job.type || 'N/A',
                salary: app.job.salary,
                applicationCount: 0
              });
            }
            const job = jobMap.get(jobId)!;
            job.applicationCount++;
          }
        });
        
        setJobs(Array.from(jobMap.values()));
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Erreur lors du chargement des offres');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobsWithApplications();
  }, []);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="min-h-screen py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestion des candidatures</h1>
              <p className="mt-1 text-muted-foreground">
                Consultez les candidatures par offre d'emploi
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total offres
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total candidatures
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.reduce((sum, job) => sum + job.applicationCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Offres avec candidatures
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.filter(job => job.applicationCount > 0).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Moyenne par offre
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jobs.length > 0 ? 
                    (jobs.reduce((sum, job) => sum + job.applicationCount, 0) / jobs.length).toFixed(1) 
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Offres d'emploi et candidatures</CardTitle>
              <CardDescription>
                Liste des offres avec le nombre de candidatures reçues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Offre</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Localisation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Salaire</TableHead>
                        <TableHead className="text-center">Candidatures</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{job.title}</p>
                              <p className="text-sm text-muted-foreground">ID: #{job.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{job.company}</TableCell>
                          <TableCell>{job.location}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{job.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {job.salary ? `${job.salary.toLocaleString()}DH` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={job.applicationCount > 0 ? "default" : "secondary"}
                              className={job.applicationCount > 0 ? "bg-green-100 text-green-800" : ""}
                            >
                              {job.applicationCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              disabled={job.applicationCount === 0}
                            >
                              <Link href={`/admin/jobs/${job.id}/applications`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Aucune offre trouvée</h3>
                  <p className="mt-2 text-muted-foreground">
                    Aucune offre d'emploi n'a été trouvée dans le système.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
