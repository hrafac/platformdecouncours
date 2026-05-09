"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAppSelector } from '@/hooks/useRedux';
import { applicationService } from '@/services/applicationService';
import { 
  Users, 
  Briefcase, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  User,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Download,
  Eye,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobApplication {
  applicationId: number;
  status: string;
  applicationDate: string;
  matchScore: number;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    salary?: number;
    description?: string;
    requirements?: string;
  };
  candidateId?: number;
  candidate?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    skills: string;
    experience: string;
  };
  cvContent?: string;
  coverLetter?: string;
  portfolioUrl?: string;
  linkedinProfile?: string;
  additionalInfo?: string;
  expectedSalary?: number;
  availabilityDate?: string;
}

export default function AdminJobApplicationsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [job, setJob] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Récupérer toutes les candidatures avec détails
        const allApplications = await applicationService.getAppliedJobsDetailsByCandidate(0); // 0 pour tous les candidats
        
        // Filtrer les applications pour ce job spécifique
        const jobApplications = allApplications.filter((app: any) => {
          const appId = app.job?.id || app.jobId;
          return appId === parseInt(jobId);
        });
        
        setApplications(jobApplications);
        
        // Extraire les infos du job (toutes les applications ont le même job)
        if (jobApplications.length > 0) {
          setJob(jobApplications[0].job);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Erreur lors du chargement des candidatures');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchApplications();
    }
  }, [jobId]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setDetailsModalOpen(true);
  };

  const viewCV = (applicationId: number) => {
    // Ouvrir directement le CV dans un nouvel onglet pour éviter les problèmes d'iframe
    const cvUrl = `http://localhost:8080/api/applications/download-cv/${applicationId}`;
    window.open(cvUrl, '_blank', 'width=1200,height=800');
  };

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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/jobs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Candidatures pour l'offre</h1>
                <p className="mt-1 text-muted-foreground">
                  {job?.title || `Job #${jobId}`}
                </p>
              </div>
            </div>
          </div>

          {/* Job Info Card */}
          {job && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Détails de l'offre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Entreprise</p>
                      <p className="font-medium">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Localisation</p>
                      <p className="font-medium">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salaire</p>
                      <p className="font-medium">{job.salary ? `${job.salary.toLocaleString()}€` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{job.type}</p>
                    </div>
                  </div>
                </div>
                {job.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{job.description}</p>
                  </div>
                )}
                {job.requirements && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Exigences</p>
                    <p className="text-sm">{job.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total candidatures
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Acceptées
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Refusées
                </CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des candidatures</CardTitle>
              <CardDescription>
                Candidatures reçues pour cette offre d'emploi
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
                  <TabsContent key={tab} value={tab}>
                    {filterApplicationsByStatus(tab).length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Candidat</TableHead>
                              <TableHead>Date de candidature</TableHead>
                              <TableHead>Score de match</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterApplicationsByStatus(tab).map((application) => {
                              const status = getStatusConfig(application.status);
                              const StatusIcon = status.icon;
                              return (
                                <TableRow key={application.applicationId}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {application.candidate?.fullName || `Candidat #${application.candidateId || 'N/A'}`}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {application.candidate?.email || 'Email non disponible'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        ID: #{application.applicationId}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{formatDate(application.applicationDate)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${application.matchScore}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">
                                        {application.matchScore.toFixed(1)}%
                                      </span>
                                    </div>
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
                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(application)}>
                                      <User className="h-4 w-4 mr-2" />
                                      Détails
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
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Aucune candidature</h3>
                        <p className="mt-2 text-muted-foreground">
                          {tab === 'all'
                            ? "Aucune candidature n'a été reçue pour cette offre."
                            : 'Aucune candidature dans cette catégorie.'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Candidate Details Modal */}
          <Modal
            isOpen={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            title="Détails du candidat"
            description="Informations complètes du candidat et documents"
          >
            {selectedApplication && (
              <div className="space-y-6">
                {/* Candidate Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations personnelles
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Nom:</span>
                        <span className="text-sm">{selectedApplication.candidate?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedApplication.candidate?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedApplication.candidate?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Compétences et expérience
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Compétences:</span>
                        <p className="text-sm mt-1">{selectedApplication.candidate?.skills || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Expérience:</span>
                        <p className="text-sm mt-1">{selectedApplication.candidate?.experience || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Détails de la candidature
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Salaire attendu:</span>
                      <p className="text-sm mt-1">
                        {selectedApplication.expectedSalary 
                          ? `${selectedApplication.expectedSalary.toLocaleString()}€` 
                          : 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Disponibilité:</span>
                      <p className="text-sm mt-1">
                        {selectedApplication.availabilityDate 
                          ? new Date(selectedApplication.availabilityDate).toLocaleDateString('fr-FR')
                          : 'Non spécifiée'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </h3>
                  <div className="space-y-3">
                    {selectedApplication.cvContent && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">CV</p>
                            <p className="text-xs text-muted-foreground">Contenu du CV disponible</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewCV(selectedApplication.applicationId!)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir CV
                        </Button>
                      </div>
                    )}
                    
                    {selectedApplication.coverLetter && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Lettre de motivation</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {selectedApplication.coverLetter}
                        </p>
                      </div>
                    )}
                    
                    {selectedApplication.portfolioUrl && (
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Portfolio</p>
                          <a 
                            href={selectedApplication.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {selectedApplication.portfolioUrl}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.linkedinProfile && (
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">LinkedIn</p>
                          <a 
                            href={selectedApplication.linkedinProfile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {selectedApplication.linkedinProfile}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.additionalInfo && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Informations supplémentaires</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedApplication.additionalInfo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </ProtectedRoute>
  );
}
