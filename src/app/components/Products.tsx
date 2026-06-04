import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { ShoppingCart, Star, Scan } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ARTryOnModal } from "@/app/components/ARTryOnModal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { apiRequest, formatPrice, Product } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Classic Aviator",
    slug: "classic-aviator",
    description: "Популярная модель в стиле aviator с AR-примеркой.",
    price_kzt: 39900,
    stock_quantity: 24,
    rating: 4.9,
    reviews_count: 127,
    tag: "Популярное",
    ar_model_name: "Aviator Gold",
    ar_model_url: "/models/classic-aviator.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    main_image_url: "https://images.unsplash.com/photo-1663344467434-66949a837661?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdmlhdG9yJTIwc3VuZ2xhc3NlcyUyMG1lbnxlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 2,
    name: "Modern Round",
    slug: "modern-round",
    description: "Серебристая круглая оправа для современного образа.",
    price_kzt: 32400,
    stock_quantity: 32,
    rating: 4.8,
    reviews_count: 89,
    tag: "Новинка",
    ar_model_name: "Round Silver",
    ar_model_url: "/models/modern-round.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    main_image_url: "https://images.unsplash.com/photo-1624917906988-2f607bae714f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3ZWFyaW5nJTIwZ2xhc3Nlc3xlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 3,
    name: "Sport Pro",
    slug: "sport-pro",
    description: "Спортивные солнцезащитные очки с карбоновой эстетикой.",
    price_kzt: 44900,
    stock_quantity: 18,
    rating: 5,
    reviews_count: 156,
    tag: "Топ продаж",
    ar_model_name: "Sport Carbon",
    ar_model_url: "/models/sport-pro.glb|https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    main_image_url: "https://images.unsplash.com/photo-1620138996011-943081eb5a10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdW5nbGFzc2VzJTIwbWVufGVufDF8fHx8MTc2OTA5OTQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  }
];

export function Products() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest<{ products: Product[] }>("/products.php")
      .then((data) => setProducts(data.products))
      .catch(() => setStatusMessage("Показаны демо-товары. Для живого каталога настройте API."));
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      alert("Чтобы заказать товар, сначала зарегистрируйтесь или войдите в аккаунт.");
      navigate("/profile");
      return;
    }

    if (user.role !== "customer") {
      alert("Заказы доступны только покупателям. Для продавца и администратора открыты служебные кабинеты.");
      navigate("/profile");
      return;
    }

    try {
      await apiRequest("/cart.php", {
        method: "POST",
        body: JSON.stringify({ action: "add", product_id: product.id, quantity: 1 })
      });
      alert("Товар добавлен в корзину.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось добавить товар в корзину.");
    }
  };

  return (
    <section id="products" className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl mb-4 text-white">Наша Коллекция</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Смотреть товары могут все посетители, а оформить заказ можно только после входа в аккаунт покупателя.
          </p>
          {statusMessage && <p className="mt-4 text-sm text-amber-300">{statusMessage}</p>}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-shadow group bg-slate-800 border-slate-700 h-full flex flex-col">
                <div className="relative overflow-hidden aspect-square">
                  {product.tag && <Badge className="absolute top-4 right-4 z-10 bg-emerald-600">{product.tag}</Badge>}
                  <ImageWithFallback
                    src={product.main_image_url || ""}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6 flex-1">
                  <h3 className="text-xl mb-2 text-white">{product.name}</h3>
                  {product.description && <p className="text-sm text-slate-400 mb-3">{product.description}</p>}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-slate-300">{Number(product.rating).toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-slate-500">({product.reviews_count} отзывов)</span>
                  </div>
                  <p className="text-2xl text-emerald-400">{formatPrice(product.price_kzt)}</p>
                  <p className="text-sm text-slate-500 mt-2">В наличии: {product.stock_quantity}</p>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800"
                    variant="outline"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Примерить
                  </Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAddToCart(product)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    В корзину
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <ARTryOnModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        productName={selectedProduct?.name || ""}
        modelName={selectedProduct?.ar_model_name || ""}
        modelUrl={selectedProduct?.ar_model_url || ""}
      />
    </section>
  );
}
