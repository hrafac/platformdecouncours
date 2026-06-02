'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ContestCard from '@/components/ContestCard';
import JobCard from '@/components/JobCard';
import { Search, ArrowRight, Users, Award, Building, TrendingUp } from 'lucide-react';
import { mockContests, categories } from '@/lib/mockData';
import { JobOffer } from '@/types';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [latestJobs, setLatestJobs] = useState<JobOffer[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestJobs = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/jobs/latest');
        if (response.ok) {
          const jobs = await response.json();
          setLatestJobs(jobs);
        }
      } catch (error) {
        console.error('Error fetching latest jobs:', error);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchLatestJobs();
  }, []);

  const filteredContests = useMemo(() => {
    return mockContests.filter((contest) => {
      const matchesSearch =
        contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || contest.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' || contest.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const stats = [
    { icon: Award, label: 'Concours actifs', value: mockContests.filter(c => c.status === 'OPEN').length },
    { icon: Users, label: 'Postes disponibles', value: mockContests.reduce((acc, c) => acc + c.positions, 0) },
    { icon: Building, label: 'Catégories', value: categories.length },
    { icon: TrendingUp, label: 'Candidatures', value: '500+' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Trouvez votre <span className="text-primary">prochain concours</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
              Découvrez les opportunités de carrière dans la fonction publique. Postulez facilement
              aux concours qui correspondent à votre profil.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/contests">
                  Explorer les concours
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
             
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-4 text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un concours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="OPEN">Ouvert</SelectItem>
                  <SelectItem value="UPCOMING">À venir</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Latest Jobs Grid */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Offres d'emploi récentes</h2>
              <Button variant="ghost" asChild>
                <Link href="/contests">
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {jobsLoading ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : latestJobs.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latestJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">
                  Aucune offre d'emploi disponible pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Prêt à commencer votre carrière?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Créez votre compte gratuitement et postulez aux concours qui vous intéressent.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/register">
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
