'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ContestCard from '@/components/ContestCard';
import ContestCardSkeleton from '@/components/ContestCardSkeleton';
import JobCard from '@/components/JobCard';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { Search, Filter, X, Briefcase } from 'lucide-react';
import { mockContests, categories } from '@/lib/mockData';
import { jobService } from '@/lib/jobService';
import type { JobOffer } from '@/types';

const ITEMS_PER_PAGE = 9;

export default function ContestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<JobOffer[]>([]);
  const [competitionsError, setCompetitionsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contests' | 'jobs'>('contests');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contestToEdit, setContestToEdit] = useState<JobOffer | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    location: '',
    competitionDate: '',
    competitionTime: '',
    competitionStatus: 'OPEN',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setJobsError(null);
        setCompetitionsError(null);
        
        // Fetch all jobs from API
        const jobsData = await jobService.getAllJobs();
        setJobs(jobsData);
        
        // Use all jobs as competitions
        setCompetitions(jobsData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setJobsError('Erreur lors du chargement des offres d\'emploi');
        setCompetitionsError('Erreur lors du chargement des concours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedContests = useMemo(() => {
    let result = competitions.filter((contest) => {
      const matchesSearch =
        contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || 
        (contest.competitionStatus && contest.competitionStatus === selectedStatus);
      return matchesSearch && matchesStatus;
    });

    // Sort
    switch (sortBy) {
      case 'recent':
        result = result.sort((a, b) => b.id - a.id);
        break;
      case 'deadline':
        result = result.sort((a, b) => {
          const dateA = a.competitionDate ? new Date(a.competitionDate).getTime() : Infinity;
          const dateB = b.competitionDate ? new Date(b.competitionDate).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
      case 'alphabetical':
        result = result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result = result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [competitions, searchQuery, selectedStatus, sortBy]);

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || job.competitionStatus === selectedStatus;
      return matchesSearch;
    });

    // Sort
    switch (sortBy) {
      case 'recent':
        result = result.sort((a, b) => b.id - a.id);
        break;
      case 'deadline':
        result = result.sort((a, b) => {
          const dateA = a.competitionDate ? new Date(a.competitionDate).getTime() : Infinity;
          const dateB = b.competitionDate ? new Date(b.competitionDate).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
      case 'alphabetical':
        result = result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result = result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [jobs, searchQuery, selectedStatus, sortBy]);

  const currentItems = activeTab === 'contests' ? filteredAndSortedContests : filteredAndSortedJobs;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    searchQuery !== '' || selectedCategory !== 'all' || selectedStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const handleDeleteContest = async (contest: JobOffer) => {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer le concours \"${contest.title}\" ?`);
    if (!confirmed) return;

    try {
      await jobService.deleteJob(contest.id);
      setCompetitions((current) => current.filter((item) => item.id !== contest.id));
      setJobs((current) => current.filter((item) => item.id !== contest.id));
      toast.success('Concours supprimé avec succès.');
    } catch (error) {
      console.error('Error deleting contest:', error);
      toast.error('Impossible de supprimer le concours.');
    }
  };

  const handleOpenEdit = (contest: JobOffer) => {
    setContestToEdit(contest);
    setEditFormData({
      title: contest.title,
      description: contest.description,
      location: contest.location,
      competitionDate: contest.competitionDate || '',
      competitionTime: contest.competitionTime || '',
      competitionStatus: contest.competitionStatus || 'OPEN',
    });
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setContestToEdit(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestToEdit) return;

    try {
      const updatedContest = await jobService.updateJob(contestToEdit.id, {
        title: editFormData.title,
        description: editFormData.description,
        location: editFormData.location,
        competitionDate: editFormData.competitionDate || null,
        competitionTime: editFormData.competitionTime || null,
        competitionStatus: editFormData.competitionStatus,
      });

      setCompetitions((current) => current.map((item) => (item.id === updatedContest.id ? updatedContest : item)));
      setJobs((current) => current.map((item) => (item.id === updatedContest.id ? updatedContest : item)));
      toast.success('Concours mis à jour avec succès.');
      handleCloseEdit();
    } catch (error) {
      console.error('Error updating contest:', error);
      toast.error('Impossible de mettre à jour le concours.');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold">Tous les concours</h1>
            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={activeTab === 'contests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('contests')}
              >
                Concours
              </Button>
              <Button
                variant={activeTab === 'jobs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('jobs')}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Offres d'emploi
              </Button>
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">
            Découvrez {currentItems.length} {activeTab === 'contests' ? 'concours' : 'offres d\'emploi'} disponibles
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, description ou lieu..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtres:</span>
              </div>
              
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="OPEN">Ouvert</SelectItem>
                  <SelectItem value="UPCOMING">À venir</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="deadline">Date limite</SelectItem>
                  <SelectItem value="positions">Nombre de postes</SelectItem>
                  <SelectItem value="alphabetical">Alphabétique</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Effacer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ContestCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedItems.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item: any) => (
                activeTab === 'contests' ? (
                  <ContestCard
                    key={item.id}
                    contest={item}
                    onEdit={() => handleOpenEdit(item)}
                    onDelete={() => handleDeleteContest(item)}
                  />
                ) : (
                  <JobCard key={item.id} job={item} />
                )
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (competitionsError && activeTab === 'contests') || (jobsError && activeTab === 'jobs') ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="text-lg font-medium">Erreur de chargement</h3>
            <p className="mt-2 text-muted-foreground">
              {activeTab === 'contests' ? competitionsError : jobsError}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="text-lg font-medium">
              Aucun {activeTab === 'contests' ? 'concours' : 'offre d\'emploi'} trouvé
            </h3>
            <p className="mt-2 text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={editModalOpen}
        onClose={handleCloseEdit}
        title="Modifier le concours"
        description="Mettez à jour les détails du concours et enregistrez les modifications."
        className="max-w-2xl"
      >
        <form onSubmit={handleUpdateContest} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              name="title"
              value={editFormData.title}
              onChange={handleEditFormChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={editFormData.description}
              onChange={handleEditFormChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                name="location"
                value={editFormData.location}
                onChange={handleEditFormChange}
              />
            </div>
            <div>
              <Label htmlFor="competitionStatus">Statut</Label>
              <Select
                value={editFormData.competitionStatus}
                onValueChange={(value) => setEditFormData((prev) => ({ ...prev, competitionStatus: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Ouvert</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                  <SelectItem value="UPCOMING">À venir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="competitionDate">Date du concours</Label>
              <Input
                id="competitionDate"
                name="competitionDate"
                type="date"
                value={editFormData.competitionDate}
                onChange={handleEditFormChange}
              />
            </div>
            <div>
              <Label htmlFor="competitionTime">Heure du concours</Label>
              <Input
                id="competitionTime"
                name="competitionTime"
                type="time"
                value={editFormData.competitionTime}
                onChange={handleEditFormChange}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="secondary" type="button" onClick={handleCloseEdit}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
