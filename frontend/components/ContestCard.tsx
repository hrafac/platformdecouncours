'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ArrowRight, Send, Pencil, Trash2 } from 'lucide-react';
import type { Contest, JobOffer } from '@/types';
import { cn } from '@/lib/utils';

interface ContestCardProps {
  contest: Contest | JobOffer;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ContestCard({ contest, onEdit, onDelete }: ContestCardProps) {
  const statusConfig = {
    OPEN: { label: 'Ouvert', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    CLOSED: { label: 'Fermé', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    UPCOMING: { label: 'À venir', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    NOT_STARTED: { label: 'À venir', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  };

  // Handle both Contest and JobOffer types
  const isJobOffer = 'company' in contest;
  const status = statusConfig[isJobOffer ? (contest.competitionStatus as keyof typeof statusConfig) || 'OPEN' : contest.status];
  const category = isJobOffer ? 'Informatique' : contest.category; // Default category for job offers
  const title = contest.title;
  const description = contest.description;
  const location = contest.location;
  
  // Handle dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  let dateDisplay;
  if (isJobOffer && contest.competitionDate) {
    // For job offers with competition data
    const competitionDate = new Date(contest.competitionDate);
    dateDisplay = formatDate(competitionDate.toISOString());
  } else if (!isJobOffer && contest.startDate && contest.endDate) {
    // For mock contests
    dateDisplay = `${formatDate(contest.startDate)} - ${formatDate(contest.endDate)}`;
  } else {
    // Fallback
    dateDisplay = 'Date à définir';
  }

  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="shrink-0">
            {category}
          </Badge>
          <Badge variant="outline" className={cn('shrink-0', status.className)}>
            {status.label}
          </Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-tight text-balance group-hover:text-primary">
          {title}
        </h3>
        {isJobOffer && (
          <p className="mt-1 text-sm text-muted-foreground">
            {contest.company}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{dateDisplay}</span>
            {isJobOffer && contest.competitionTime && (
              <span> à {contest.competitionTime.slice(0, 5)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{location}</span>
          </div>
          {!isJobOffer && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>{contest.positions} poste{contest.positions > 1 ? 's' : ''}</span>
            </div>
          )}
          {isJobOffer && contest.salary && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{contest.salary.toLocaleString('fr-FR')} DH</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 w-full">
            {/* Voir détails button */}
            <Button asChild variant="outline" className="flex-1 group/btn">
              <Link href={isJobOffer ? `/jobs/${contest.id}` : `/contests/${contest.id}`}>
                Voir détails
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
            
            {/* Postuler button - show for open contests and job offers */}
            {(!isJobOffer && contest.status === 'OPEN') || (isJobOffer && (!contest.competitionStatus || contest.competitionStatus === 'OPEN')) ? (
              <Button asChild className="flex-1 group/btn">
                <Link href={isJobOffer ? `/jobs/${contest.id}/apply` : `/contests/${contest.id}/apply`}>
                  Postuler
                  <Send className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            ) : null}
          </div>

          {(onEdit || onDelete) && (
            <div className="flex flex-wrap gap-2 w-full">
              {onEdit && (
                <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Modifier
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" className="flex-1" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
