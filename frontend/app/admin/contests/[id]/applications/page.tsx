'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loader from '@/components/Loader';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockContests, mockApplications } from '@/lib/mockData';
import type { Contest, Application, ApplicationStatus } from '@/types';
import {
  ArrowLeft,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Mail,
  User,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ContestApplicationsPage() {
  const params = useParams();
  const [contest, setContest] = useState<Contest | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const foundContest = mockContests.find((c) => c.id === params.id);
      const contestApplications = mockApplications.filter((a) => a.contestId === params.id);
      setContest(foundContest || null);
      setApplications(contestApplications);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.id]);

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

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications(
      applications.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
    toast.success(
      newStatus === 'ACCEPTED' ? 'Candidature acceptée' : 'Candidature refusée'
    );
  };

  const viewApplicationDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
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

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Candidatures</h1>
            <p className="mt-1 text-muted-foreground">{contest.title}</p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Acceptées</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Refusées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </CardContent>
            </Card>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des candidatures</CardTitle>
              <CardDescription>
                Gérez les candidatures pour ce concours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidat</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => {
                        const status = statusConfig[application.status];
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={application.id}>
                            <TableCell className="font-medium">
                              {application.candidateName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {application.candidateEmail}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(application.appliedAt)}
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => viewApplicationDetails(application)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  {application.status === 'PENDING' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(application.id, 'ACCEPTED')
                                        }
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Accepter
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(application.id, 'REJECTED')
                                        }
                                        className="text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Refuser
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Aucune candidature</h3>
                  <p className="mt-2 text-muted-foreground">
                    Ce concours n&apos;a pas encore reçu de candidatures.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la candidature</DialogTitle>
            <DialogDescription>
              Informations complètes sur la candidature
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{selectedApplication.candidateName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApplication.candidateEmail}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Statut actuel</p>
                <Badge
                  variant="outline"
                  className={cn('gap-1', statusConfig[selectedApplication.status].className)}
                >
                  {(() => {
                    const StatusIcon = statusConfig[selectedApplication.status].icon;
                    return <StatusIcon className="h-3 w-3" />;
                  })()}
                  {statusConfig[selectedApplication.status].label}
                </Badge>
              </div>

              {/* Cover Letter */}
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Lettre de motivation</p>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm leading-relaxed">
                    {selectedApplication.coverLetter}
                  </p>
                </div>
              </div>

              {/* CV Download */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">CV du candidat</p>
                    <p className="text-sm text-muted-foreground">Format PDF</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>

              {/* Actions */}
              {selectedApplication.status === 'PENDING' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(selectedApplication.id, 'ACCEPTED');
                      setDetailsOpen(false);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(selectedApplication.id, 'REJECTED');
                      setDetailsOpen(false);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
