import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-bold">C</span>
              </div>
              <span className="text-xl font-bold">MARSA MAROC</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Plateforme de gestion des concours publics. Trouvez et postulez aux opportunités qui correspondent à votre profil.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold">Liens rapides</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/contests" className="text-sm text-muted-foreground hover:text-foreground">
                  Tous les concours
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold">Catégories</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/contests?category=Informatique" className="text-sm text-muted-foreground hover:text-foreground">
                  Informatique
                </Link>
              </li>
              <li>
                <Link href="/contests?category=Santé" className="text-sm text-muted-foreground hover:text-foreground">
                  Santé
                </Link>
              </li>
              <li>
                <Link href="/contests?category=Éducation" className="text-sm text-muted-foreground hover:text-foreground">
                  Éducation
                </Link>
              </li>
              <li>
                <Link href="/contests?category=Administration" className="text-sm text-muted-foreground hover:text-foreground">
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                contact@MARSAMAROC.ma
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                +212 5 00 00 00 00
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                Avenue Mohammed V, Rabat, Maroc
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} MARSA MAROC. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
