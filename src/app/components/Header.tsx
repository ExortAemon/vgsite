import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string, sectionId?: string) => {
    if (location.pathname !== path) {
      navigate(path);
      if (sectionId) {
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else if (sectionId) {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl text-emerald-400">
            EyeWear
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavigation('/')}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Главная
            </button>
            <button
              onClick={() => handleNavigation('/', 'products')}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Каталог
            </button>
            <button
              onClick={() => handleNavigation('/', 'contacts')}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Контакты
            </button>
            <Link to="/about" className="text-slate-300 hover:text-emerald-400 transition-colors">
              О нас
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-400">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-400">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleNavigation('/')}
                className="text-slate-300 hover:text-emerald-400 transition-colors text-left"
              >
                Главная
              </button>
              <button
                onClick={() => handleNavigation('/', 'products')}
                className="text-slate-300 hover:text-emerald-400 transition-colors text-left"
              >
                Каталог
              </button>
              <button
                onClick={() => handleNavigation('/', 'contacts')}
                className="text-slate-300 hover:text-emerald-400 transition-colors text-left"
              >
                Контакты
              </button>
              <button
                onClick={() => handleNavigation('/about')}
                className="text-slate-300 hover:text-emerald-400 transition-colors text-left"
              >
                О нас
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}