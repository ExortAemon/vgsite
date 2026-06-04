import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, Store, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";
  const isServiceAccount = isSeller || isAdmin;

  const handleNavigation = (path: string, sectionId?: string) => {
    if (location.pathname !== path) {
      navigate(path);
      if (sectionId) {
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

  const renderShopNavigation = (isMobile = false) => (
    <>
      <button onClick={() => handleNavigation('/')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>Главная</button>
      <button onClick={() => handleNavigation('/', 'products')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>Каталог</button>
      <button onClick={() => handleNavigation('/', 'contacts')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>Контакты</button>
      <button onClick={() => handleNavigation('/about')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>О нас</button>
    </>
  );

  const renderServiceNavigation = (isMobile = false) => (
    <>
      <button onClick={() => handleNavigation('/profile')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>
        {isSeller ? 'Все заказы' : 'Действия пользователей'}
      </button>
      <button onClick={() => handleNavigation('/profile')} className={`text-slate-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-left' : ''}`}>
        {isSeller ? 'Кабинет продавца' : 'Панель администратора'}
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={isServiceAccount ? "/profile" : "/"} className="text-2xl text-emerald-400">
            EyeWear
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {isServiceAccount ? renderServiceNavigation() : renderShopNavigation()}
          </nav>

          <div className="flex items-center gap-4">
            {!isServiceAccount && (
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-400" aria-label="Корзина">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-400" aria-label={isAdmin ? "Админ" : isSeller ? "Продавец" : "Личный кабинет"}>
                {isAdmin ? <Shield className="h-5 w-5" /> : isSeller ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-4">
              {isServiceAccount ? renderServiceNavigation(true) : renderShopNavigation(true)}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
