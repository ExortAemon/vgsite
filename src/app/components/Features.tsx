import { Shield, Truck, Award, Headphones } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { motion } from "motion/react";

const features = [
  {
    icon: Shield,
    title: "100% Защита UV",
    description: "Все наши очки обеспечивают полную защиту от ультрафиолета"
  },
  {
    icon: Truck,
    title: "Бесплатная доставка",
    description: "Быстрая доставка по всему Казахстану при заказе от 25 000₸"
  },
  {
    icon: Award,
    title: "Гарантия качества",
    description: "2 года гарантии на все модели очков"
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    description: "Наша команда всегда готова помочь вам с выбором"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-slate-900 h-full">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.15 + 0.3,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="w-16 h-16 bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Icon className="h-8 w-8 text-emerald-400" />
                    </motion.div>
                    <h3 className="mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}