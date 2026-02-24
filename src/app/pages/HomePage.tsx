import { Hero } from "@/app/components/Hero";
import { Features } from "@/app/components/Features";
import { Products } from "@/app/components/Products";
import { ContactForm } from "@/app/components/ContactForm";

export function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Products />
      <ContactForm />
    </>
  );
}
