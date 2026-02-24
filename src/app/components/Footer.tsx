import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl mb-4 text-emerald-400">EyeWear</h3>
            <p className="text-slate-400">
              Премиальные очки для тех, кто ценит стиль и качество.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-emerald-400">Каталог</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Солнцезащитные очки</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Оптические очки</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Спортивные очки</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Детские очки</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-emerald-400">Информация</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">О компании</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Доставка и оплата</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Гарантия</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Контакты</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-emerald-400">Мы в соцсетях</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
          <p>© 2026 EyeWear. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}