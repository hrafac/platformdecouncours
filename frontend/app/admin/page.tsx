'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import { mockContests, mockApplications } from '@/lib/mockData';
import type { Contest, JobOffer } from '@/types';
import { jobService } from '@/lib/jobService';
import { userService, type User } from '@/lib/userService';
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Users,
  FileText,
  Award,
  TrendingUp,
  Shield,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [contests, setContests] = useState<JobOffer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contests' | 'users'>('contests');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<JobOffer | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contestToView, setContestToView] = useState<JobOffer | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [contestToEdit, setContestToEdit] = useState<JobOffer | null>(null);
  const [editContestModalOpen, setEditContestModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUserFormData, setEditUserFormData] = useState({
    email: '',
    password: '',
    role: 'CANDIDATE' as 'ADMIN' | 'CANDIDATE'
  });
  const [editContestFormData, setEditContestFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    salary: '',
    location: '',
    type: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP',
    competitionDate: '',
    competitionTime: '',
    competitionStatus: 'NOT_STARTED' as 'OPEN' | 'CLOSED' | 'UPCOMING' | 'NOT_STARTED'
  });
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    salary: '',
    location: '',
    type: 'FULL_TIME' as const,
    competitionDate: '',
    competitionTime: '',
    competitionStatus: 'NOT_STARTED' as const
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [contestsData, usersData] = await Promise.all([
          jobService.getAllJobs(),
          userService.getAllUsers()
        ]);
        console.log('API Data received:', { contests: contestsData, users: usersData });
        setContests(contestsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statusConfig = {
    OPEN: { label: 'Ouvert', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    CLOSED: { label: 'Fermé', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    UPCOMING: { label: 'À venir', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    NOT_STARTED: { label: 'À venir', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDeleteContest = async () => {
    if (contestToDelete) {
      try {
        await jobService.deleteJob(contestToDelete.id);
        setContests(contests.filter((c) => c.id !== contestToDelete.id));
        toast.success('Concours supprimé avec succès');
        setDeleteModalOpen(false);
        setContestToDelete(null);
      } catch (error) {
        console.error('Error deleting contest:', error);
        toast.error('Erreur lors de la suppression du concours');
      }
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await userService.deleteUser(userToDelete.id);
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        toast.success('Utilisateur supprimé avec succès');
        setDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: 'ADMIN' | 'CANDIDATE') => {
    try {
      const updatedUser = await userService.updateUserRole(userId, newRole);
      setUsers(users.map((u) => u.id === userId ? updatedUser : u));
      toast.success(`Rôle de l'utilisateur mis à jour avec succès`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditUserFormData({
      email: user.email,
      password: '',
      role: user.role
    });
    setEditModalOpen(true);
  };

  const handleEditUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    try {
      const updateData: any = {
        email: editUserFormData.email,
        role: editUserFormData.role
      };

      // Only include password if it's not empty
      if (editUserFormData.password.trim()) {
        updateData.password = editUserFormData.password;
      }

      const updatedUser = await userService.updateUser(userToEdit.id, updateData);
      setUsers(users.map((u) => u.id === userToEdit.id ? updatedUser : u));
      toast.success('Utilisateur mis à jour avec succès');
      setEditModalOpen(false);
      setUserToEdit(null);
      setEditUserFormData({
        email: '',
        password: '',
        role: 'CANDIDATE'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  const handleDelete = () => {
    if (activeTab === 'contests') {
      handleDeleteContest();
    } else {
      handleDeleteUser();
    }
  };

  const handleCreateContest = () => {
    setCreateModalOpen(true);
  };

  const handleViewContest = async (contestId: number) => {
    try {
      const contestDetails = await jobService.getJobById(contestId.toString());
      setContestToView(contestDetails);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching contest details:', error);
      toast.error('Erreur lors du chargement des détails du concours');
      
      // Fallback: use the contest data from the list
      const contestFromList = contests.find(c => c.id === contestId);
      if (contestFromList) {
        setContestToView(contestFromList);
        setViewModalOpen(true);
      }
    }
  };

  const handleEditContest = (contest: JobOffer) => {
    setContestToEdit(contest);
    setEditContestFormData({
      title: contest.title,
      company: contest.company,
      description: contest.description,
      requirements: contest.requirements,
      salary: contest.salary.toString(),
      location: contest.location,
      type: (contest.type as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'),
      competitionDate: contest.competitionDate || '',
      competitionTime: contest.competitionTime || '',
      competitionStatus: (contest.competitionStatus as 'OPEN' | 'CLOSED' | 'UPCOMING' | 'NOT_STARTED') || 'NOT_STARTED'
    });
    setEditContestModalOpen(true);
  };

  const handleEditContestInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditContestFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestToEdit) return;

    try {
      const updateData = {
        ...editContestFormData,
        salary: parseFloat(editContestFormData.salary)
      };

      const updatedContest = await jobService.updateJob(contestToEdit.id, updateData);
      setContests(contests.map((c) => c.id === contestToEdit.id ? updatedContest : c));
      toast.success('Concours mis à jour avec succès');
      setEditContestModalOpen(false);
      setContestToEdit(null);
      setEditContestFormData({
        title: '',
        company: '',
        description: '',
        requirements: '',
        salary: '',
        location: '',
        type: 'FULL_TIME',
        competitionDate: '',
        competitionTime: '',
        competitionStatus: 'NOT_STARTED'
      });
    } catch (error) {
      console.error('Error updating contest:', error);
      toast.error('Erreur lors de la mise à jour du concours');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newJobData = {
        ...formData,
        salary: parseFloat(formData.salary)
      };

      const createdJob = await jobService.createJob(newJobData);
      setContests([...contests, createdJob]);
      toast.success('Nouveau concours créé avec succès');
      setCreateModalOpen(false);
      setFormData({
        title: '',
        company: '',
        description: '',
        requirements: '',
        salary: '',
        location: '',
        type: 'FULL_TIME',
        competitionDate: '',
        competitionTime: '',
        competitionStatus: 'NOT_STARTED'
      });
    } catch (error) {
      console.error('Error creating contest:', error);
      toast.error('Erreur lors de la création du concours');
    }
  };

  const formatDateTime = (dateString: string | null, timeString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = timeString ? timeString.slice(0, 5) : '';
    return time ? `${date} à ${time}` : date;
  };

  const getApplicationsCount = (contestId: string) => {
    return mockApplications.filter((a) => a.contestId === contestId).length;
  };

  const stats = {
    totalContests: contests.length,
    openContests: contests.filter((c) => c.competitionStatus === 'OPEN').length,
    totalApplications: 0, // Pas de données d'applications dans l'API
    totalPositions: contests.length, // Chaque concours compte comme 1 poste
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === 'ADMIN').length,
    candidateUsers: users.filter((u) => u.role === 'CANDIDATE').length,
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
              <p className="mt-1 text-muted-foreground">
                Gérez les concours, les candidatures et les utilisateurs
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/jobs">
                  <FileText className="mr-2 h-4 w-4" />
                  Gérer les candidatures
                </Link>
              </Button>
              {activeTab === 'contests' && (
                <Button onClick={handleCreateContest}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau concours
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('contests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'contests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Award className="inline-block w-4 h-4 mr-2" />
                  Concours
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="inline-block w-4 h-4 mr-2" />
                  Utilisateurs
                </button>
              </nav>
            </div>
          </div>

          {isLoading ? (
            <Loader fullScreen />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {activeTab === 'contests' ? (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total concours
                        </CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.totalContests}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Concours ouverts
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">{stats.openContests}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Candidatures
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.totalApplications}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Postes ouverts
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.totalPositions}</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total utilisateurs
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Administrateurs
                        </CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-blue-600">{stats.adminUsers}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Candidats
                        </CardTitle>
                        <UserCog className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">{stats.candidateUsers}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Taux d'admin
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {stats.totalUsers > 0 ? Math.round((stats.adminUsers / stats.totalUsers) * 100) : 0}%
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {activeTab === 'contests' ? (
                /* Contests Table */
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des concours</CardTitle>
                    <CardDescription>
                      Liste de tous les concours et leurs statistiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Entreprise</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date concours</TableHead>
                            <TableHead>Heure concours</TableHead>
                            <TableHead>Statut concours</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contests.map((contest) => {
                            const status = contest.competitionStatus ? statusConfig[contest.competitionStatus as keyof typeof statusConfig] : null;
                            return (
                              <TableRow key={contest.id}>
                                <TableCell>
                                  <p className="max-w-[250px] truncate font-medium">
                                    {contest.title}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-muted-foreground">{contest.company}</p>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{contest.type}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {contest.competitionDate ? formatDate(contest.competitionDate) : '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {contest.competitionTime ? contest.competitionTime.slice(0, 5) : '-'}
                                </TableCell>
                                <TableCell>
                                  {status ? (
                                    <Badge variant="outline" className={cn(status.className)}>
                                      {status.label}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                                      Non défini
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewContest(contest.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Voir les détails
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditContest(contest)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                          setContestToDelete(contest);
                                          setDeleteModalOpen(true);
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Users Table */
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des utilisateurs</CardTitle>
                    <CardDescription>
                      Liste de tous les utilisateurs et leurs rôles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <p className="font-medium">#{user.id}</p>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{user.email}</p>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                                  className={user.role === 'ADMIN' ? 'bg-blue-500 text-white' : ''}
                                >
                                  {user.role === 'ADMIN' ? (
                                    <>
                                      <Shield className="w-3 h-3 mr-1" />
                                      Administrateur
                                    </>
                                  ) : (
                                    <>
                                      <UserCog className="w-3 h-3 mr-1" />
                                      Candidat
                                    </>
                                  )}
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
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateUserRole(
                                        user.id, 
                                        user.role === 'ADMIN' ? 'CANDIDATE' : 'ADMIN'
                                      )}
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      {user.role === 'ADMIN' ? 'Rétrograder en candidat' : 'Promouvoir en admin'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setDeleteModalOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={activeTab === 'contests' ? 'Supprimer le concours' : 'Supprimer l\'utilisateur'}
        description="Cette action est irréversible."
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {activeTab === 'contests' 
              ? `Êtes-vous sûr de vouloir supprimer le concours "${contestToDelete?.title}"? Toutes les candidatures associées seront également supprimées.`
              : `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.email}"? Cette action est irréversible.`
            }
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Contest Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Créer un nouveau concours"
        description="Remplissez les informations pour créer un nouveau concours"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du concours</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Prérequis</Label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salaire</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              >
                <option value="FULL_TIME">Temps plein</option>
                <option value="PART_TIME">Temps partiel</option>
                <option value="CONTRACT">Contrat</option>
                <option value="INTERNSHIP">Stage</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitionDate">Date du concours</Label>
              <Input
                id="competitionDate"
                name="competitionDate"
                type="date"
                value={formData.competitionDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitionTime">Heure du concours</Label>
              <Input
                id="competitionTime"
                name="competitionTime"
                type="time"
                value={formData.competitionTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitionStatus">Statut du concours</Label>
            <select
              id="competitionStatus"
              name="competitionStatus"
              value={formData.competitionStatus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            >
              <option value="NOT_STARTED">À venir</option>
              <option value="OPEN">Ouvert</option>
              <option value="CLOSED">Fermé</option>
              <option value="UPCOMING">Bientôt disponible</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer le concours
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier l'utilisateur"
        description="Modifiez les informations de l'utilisateur"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editEmail">Email</Label>
            <Input
              id="editEmail"
              name="email"
              type="email"
              value={editUserFormData.email}
              onChange={handleEditUserInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPassword">Nouveau mot de passe (laisser vide pour ne pas modifier)</Label>
            <Input
              id="editPassword"
              name="password"
              type="password"
              value={editUserFormData.password}
              onChange={handleEditUserInputChange}
              placeholder="Laisser vide si inchangé"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editRole">Rôle</Label>
            <select
              id="editRole"
              name="role"
              value={editUserFormData.role}
              onChange={handleEditUserInputChange}
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            >
              <option value="CANDIDATE">Candidat</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Mettre à jour l'utilisateur
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Contest Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Détails du concours"
        description="Informations complètes du concours"
      >
        {contestToView && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Titre</Label>
                <p className="font-semibold">{contestToView.title}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Entreprise</Label>
                <p className="font-semibold">{contestToView.company}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm leading-relaxed bg-muted p-3 rounded-md">
                {contestToView.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Prérequis</Label>
              <p className="text-sm leading-relaxed bg-muted p-3 rounded-md">
                {contestToView.requirements}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Salaire</Label>
                <p className="font-semibold">{contestToView.salary.toLocaleString('fr-FR')} €</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Lieu</Label>
                <p className="font-semibold">{contestToView.location}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                <Badge variant="secondary">{contestToView.type}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Date du concours</Label>
                <p className="font-semibold">
                  {contestToView.competitionDate ? formatDate(contestToView.competitionDate) : 'Non définie'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Heure du concours</Label>
                <p className="font-semibold">
                  {contestToView.competitionTime ? contestToView.competitionTime.slice(0, 5) : 'Non définie'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                {(() => {
                  const status = contestToView.competitionStatus ? statusConfig[contestToView.competitionStatus as keyof typeof statusConfig] : null;
                  return status ? (
                    <Badge variant="outline" className={cn(status.className)}>
                      {status.label}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                      Non défini
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Contest Modal */}
      <Modal
        isOpen={editContestModalOpen}
        onClose={() => setEditContestModalOpen(false)}
        title="Modifier le concours"
        description="Modifiez les informations du concours"
      >
        <form onSubmit={handleUpdateContest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Titre du concours</Label>
              <Input
                id="editTitle"
                name="title"
                value={editContestFormData.title}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCompany">Entreprise</Label>
              <Input
                id="editCompany"
                name="company"
                value={editContestFormData.company}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDescription">Description</Label>
            <textarea
              id="editDescription"
              name="description"
              value={editContestFormData.description}
              onChange={handleEditContestInputChange}
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editRequirements">Prérequis</Label>
            <textarea
              id="editRequirements"
              name="requirements"
              value={editContestFormData.requirements}
              onChange={handleEditContestInputChange}
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editSalary">Salaire</Label>
              <Input
                id="editSalary"
                name="salary"
                type="number"
                step="0.01"
                value={editContestFormData.salary}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLocation">Lieu</Label>
              <Input
                id="editLocation"
                name="location"
                value={editContestFormData.location}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editType">Type</Label>
              <select
                id="editType"
                name="type"
                value={editContestFormData.type}
                onChange={handleEditContestInputChange}
                className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              >
                <option value="FULL_TIME">Temps plein</option>
                <option value="PART_TIME">Temps partiel</option>
                <option value="CONTRACT">Contrat</option>
                <option value="INTERNSHIP">Stage</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCompetitionDate">Date du concours</Label>
              <Input
                id="editCompetitionDate"
                name="competitionDate"
                type="date"
                value={editContestFormData.competitionDate}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCompetitionTime">Heure du concours</Label>
              <Input
                id="editCompetitionTime"
                name="competitionTime"
                type="time"
                value={editContestFormData.competitionTime}
                onChange={handleEditContestInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCompetitionStatus">Statut du concours</Label>
            <select
              id="editCompetitionStatus"
              name="competitionStatus"
              value={editContestFormData.competitionStatus}
              onChange={handleEditContestInputChange}
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            >
              <option value="NOT_STARTED">À venir</option>
              <option value="OPEN">Ouvert</option>
              <option value="CLOSED">Fermé</option>
              <option value="UPCOMING">Bientôt disponible</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditContestModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Mettre à jour le concours
            </Button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
