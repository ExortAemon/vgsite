import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { HomePage } from "@/app/pages/HomePage";
import { CatalogPage } from "@/app/pages/CatalogPage";
import { CartPage } from "@/app/pages/CartPage";
import { ProfilePage } from "@/app/pages/ProfilePage";
import { AboutPage } from "@/app/pages/AboutPage";
import { ContactsPage } from "@/app/pages/ContactsPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/contacts"
              element={<ContactsPage />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}