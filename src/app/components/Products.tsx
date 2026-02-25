import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { ShoppingCart, Star, Scan } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ARTryOnModal } from "@/app/components/ARTryOnModal";
import { useState } from "react";
import { motion } from "motion/react";

const products = [
  {
    id: 1,
    name: "Classic Aviator",
    arModelName: "Aviator Gold",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "39 900₸",
    rating: 4.9,
    reviews: 127,
    image: "https://images.unsplash.com/photo-1663344467434-66949a837661?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdmlhdG9yJTIwc3VuZ2xhc3NlcyUyMG1lbnxlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: "Популярное"
  },
  {
    id: 2,
    name: "Modern Round",
    arModelName: "Round Silver",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "32 400₸",
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1624917906988-2f607bae714f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3ZWFyaW5nJTIwZ2xhc3Nlc3xlbnwxfHx8fDE3NjkwOTk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: "Новинка"
  },
  {
    id: 3,
    name: "Sport Pro",
    arModelName: "Sport Carbon",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "44 900₸",
    rating: 5.0,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1620138996011-943081eb5a10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdW5nbGFzc2VzJTIwbWVufGVufDF8fHx8MTc2OTA5OTQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: "Топ продаж"
  },
  {
    id: 4,
    name: "Vintage Square",
    arModelName: "Vintage Matte",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "29 900₸",
    rating: 4.7,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1714356590155-f896e15d21c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBzdW5nbGFzc2VzfGVufDF8fHx8MTc2OTA5OTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: null
  },
  {
    id: 5,
    name: "Designer Cat Eye",
    arModelName: "Cat Eye Premium",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "47 400₸",
    rating: 4.9,
    reviews: 143,
    image: "https://images.unsplash.com/photo-1732139637068-41c50825dca1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwZXlld2VhciUyMHN0eWxlfGVufDF8fHx8MTc2OTA5OTQ5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: "Премиум"
  },
  {
    id: 6,
    name: "Urban Wayfarer",
    arModelName: "Wayfarer Urban",
    arModelUrl: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb|https://github.com/KhronosGroup/glTF-Sample-Assets/raw/main/Models/SunglassesKhronos/glTF-Binary/SunglassesKhronos.glb",
    price: "34 900₸",
    rating: 4.8,
    reviews: 108,
    image: "https://images.unsplash.com/photo-1723179754179-61a91b48d702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwc3VuZ2xhc3NlcyUyMHByb2R1Y3R8ZW58MXx8fHwxNzY5MDk5NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tag: null
  }
];

export function Products() {
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);

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
            Откройте для себя идеальную пару очков, которая подчеркнет ваш стиль
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-shadow group bg-slate-800 border-slate-700 h-full flex flex-col">
                <div className="relative overflow-hidden aspect-square">
                  {product.tag && (
                    <Badge className="absolute top-4 right-4 z-10 bg-emerald-600">
                      {product.tag}
                    </Badge>
                  )}
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6 flex-1">
                  <h3 className="text-xl mb-2 text-white">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-slate-300">{product.rating}</span>
                    </div>
                    <span className="text-sm text-slate-500">({product.reviews} отзывов)</span>
                  </div>
                  <p className="text-2xl text-emerald-400">{product.price}</p>
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
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
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
        modelName={selectedProduct?.arModelName || ""}
        modelUrl={selectedProduct?.arModelUrl || ""}
      />
    </section>
  );
}
