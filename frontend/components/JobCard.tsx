'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Building, Clock, ArrowRight } from 'lucide-react';
import type { JobOffer } from '@/types';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobOffer;
}

export default function JobCard({ job }: JobCardProps) {
  const getStatusConfig = (status?: string) => {
    if (!status) return { label: 'Non défini', className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    
    switch (status) {
      case 'NOT_STARTED':
        return { label: 'Pas commencé', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'IN_PROGRESS':
        return { label: 'En cours', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
      case 'COMPLETED':
        return { label: 'Terminé', className: 'bg-green-500/10 text-green-600 border-green-500/20' };
      default:
        return { label: status, className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return { label: 'Temps plein', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'PART_TIME':
        return { label: 'Temps partiel', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
      case 'CONTRACT':
        return { label: 'Contrat', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
      default:
        return { label: type, className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    }
  };

  const statusConfig = getStatusConfig(job.competitionStatus);
  const typeConfig = getTypeConfig(job.type);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format HH:MM
  };

  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="shrink-0">
            <Building className="mr-1 h-3 w-3" />
            {job.company}
          </Badge>
          <Badge variant="outline" className={cn('shrink-0', typeConfig.className)}>
            {typeConfig.label}
          </Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-tight text-balance group-hover:text-primary">
          {job.title}
        </h3>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {job.description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{job.location}</span>
          </div>
          {job.competitionDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {formatDate(job.competitionDate)}
                {job.competitionTime && ` à ${formatTime(job.competitionTime)}`}
              </span>
            </div>
          )}
          {job.competitionStatus && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button asChild className="w-full group/btn">
          <Link href={`/jobs/${job.id}`}>
            Voir détails
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
