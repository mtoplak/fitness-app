import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">WiiFit</h3>
            <p className="text-sm text-muted-foreground">
              Vaš partner za doseganje fitnes ciljev
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Strani</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Domov
                </Link>
              </li>
              <li>
                <Link to="/urnik" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Urnik skupinskih vadb
                </Link>
              </li>
              <li>
                <Link to="/personal-training" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Osebni treningi
                </Link>
              </li>
              <li>
                <Link to="/membership" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Članarine
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Moj račun</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Prijava
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Registracija
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Profil
                </Link>
              </li>
              <li>
                <Link to="/register-trainer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Registracija trenerja
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Sledite nam</h4>
            <div className="flex items-center space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">© 2025 WiiFit. Vse pravice pridržane.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
