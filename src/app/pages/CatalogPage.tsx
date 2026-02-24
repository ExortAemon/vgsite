import { Products } from "@/app/components/Products";

export function CatalogPage() {
  return (
    <div className="min-h-screen bg-slate-900 pt-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl mb-4 text-white text-center">
          Каталог Очков
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto text-center mb-12">
          Полный каталог наших товаров
        </p>
      </div>
      <Products />
    </div>
  );
}
