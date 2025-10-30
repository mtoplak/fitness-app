import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(10,90%,50%)] bg-clip-text text-transparent">
              WiiFit
            </a>
            <div className="hidden md:flex space-x-6">
              <a href="#ponudba" className="text-foreground/80 hover:text-primary transition-colors">
                Ponudba
              </a>
              <a href="#urnik" className="text-foreground/80 hover:text-primary transition-colors">
                Urnik
              </a>
              <a href="#kalkulator" className="text-foreground/80 hover:text-primary transition-colors">
                Prostorski kalkulator
              </a>
              <a href="#profil" className="text-foreground/80 hover:text-primary transition-colors">
                Moj profil
              </a>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard"><Button variant="ghost">{user.fullName}</Button></Link>
                <Button variant="outline" onClick={logout}>Odjava</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Prijava</Button></Link>
                <Link to="/register"><Button>Registracija</Button></Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <a href="#ponudba" className="block py-2 text-foreground/80 hover:text-primary">
              Ponudba
            </a>
            <a href="#urnik" className="block py-2 text-foreground/80 hover:text-primary">
              Urnik
            </a>
            <a href="#kalkulator" className="block py-2 text-foreground/80 hover:text-primary">
              Prostorski kalkulator
            </a>
            <a href="#profil" className="block py-2 text-foreground/80 hover:text-primary">
              Moj profil
            </a>
            <div className="flex flex-col space-y-2 pt-2">
              {user ? (
                <>
                  <Link to="/dashboard"><Button variant="ghost" className="w-full">{user.fullName}</Button></Link>
                  <Button variant="outline" className="w-full" onClick={() => { setIsMenuOpen(false); logout(); }}>Odjava</Button>
                </>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" className="w-full">Prijava</Button></Link>
                  <Link to="/register"><Button className="w-full">Registracija</Button></Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
