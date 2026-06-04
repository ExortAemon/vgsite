import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { HomePage } from "@/app/pages/HomePage";
import { CatalogPage } from "@/app/pages/CatalogPage";
import { CartPage } from "@/app/pages/CartPage";
import { ProfilePage } from "@/app/pages/ProfilePage";
import { AboutPage } from "@/app/pages/AboutPage";
import { ContactsPage } from "@/app/pages/ContactsPage";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";

function RoleAwarePage({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 py-12 text-center text-slate-300">Загрузка...</div>;
  }

  if (user?.role === "seller" || user?.role === "admin") {
    return <ProfilePage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RoleAwarePage><HomePage /></RoleAwarePage>} />
              <Route path="/catalog" element={<RoleAwarePage><CatalogPage /></RoleAwarePage>} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/about" element={<RoleAwarePage><AboutPage /></RoleAwarePage>} />
              <Route path="/contacts" element={<RoleAwarePage><ContactsPage /></RoleAwarePage>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
