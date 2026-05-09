'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Loader from '@/components/Loader';
import { useAppSelector } from '@/hooks/useRedux';
import { mockContests } from '@/lib/mockData';
import type { Contest } from '@/types';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const foundContest = mockContests.find((c) => c.id === params.id);
      setContest(foundContest || null);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [params.id]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!contest) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold">Concours non trouvé</h1>
        <p className="mt-2 text-muted-foreground">
          Le concours que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/contests">Retour aux concours</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = {
    OPEN: { label: 'Ouvert', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    CLOSED: { label: 'Fermé', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    UPCOMING: { label: 'À venir', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  };

  const status = statusConfig[contest.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    const endDate = new Date(contest.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push(`/contests/${contest.id}/apply`);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/contests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux concours
          </Link>
        </Button>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{contest.category}</Badge>
                    <Badge variant="outline" className={cn(status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  {contest.status === 'OPEN' && daysRemaining > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <CardTitle className="mt-4 text-2xl">{contest.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Info */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date limite</p>
                      <p className="text-sm font-medium">
                        {new Date(contest.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu</p>
                      <p className="text-sm font-medium">{contest.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Postes</p>
                      <p className="text-sm font-medium">{contest.positions}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    Description
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {contest.description}
                  </p>
                </div>

                <Separator />

                {/* Requirements */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Conditions requises
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {contest.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Dates */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="h-5 w-5" />
                    Période du concours
                  </h3>
                  <div className="mt-3 space-y-2">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Début:</span>{' '}
                      {formatDate(contest.startDate)}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Fin:</span>{' '}
                      {formatDate(contest.endDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Apply Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Postuler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contest.status === 'OPEN' ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {contest.positions} poste{contest.positions > 1 ? 's' : ''} disponible{contest.positions > 1 ? 's' : ''} pour ce concours.
                    </p>
                    {!isAuthenticated && (
                      <p className="text-sm text-muted-foreground">
                        Connectez-vous pour soumettre votre candidature.
                      </p>
                    )}
                    {isAuthenticated && user?.role === 'ADMIN' && (
                      <p className="text-sm text-yellow-600">
                        Les administrateurs ne peuvent pas postuler aux concours.
                      </p>
                    )}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleApply}
                      disabled={isAuthenticated && user?.role === 'ADMIN'}
                    >
                      {isAuthenticated ? 'Postuler maintenant' : 'Se connecter pour postuler'}
                    </Button>
                  </>
                ) : contest.status === 'UPCOMING' ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Ce concours n&apos;est pas encore ouvert aux candidatures.
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Ouverture:</span>{' '}
                      {formatDate(contest.startDate)}
                    </p>
                    <Button className="w-full" size="lg" disabled>
                      Bientôt disponible
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Ce concours est fermé aux nouvelles candidatures.
                    </p>
                    <Button className="w-full" size="lg" disabled>
                      Concours fermé
                    </Button>
                  </>
                )}

                <Separator />

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Besoin d&apos;aide?</p>
                  <p className="mt-1">
                    Contactez-nous à{' '}
                    <a href="mailto:support@concourshub.ma" className="text-primary hover:underline">
                      support@concourshub.ma
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
